from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit.Chem import Descriptors
from pydantic import BaseModel
from typing import List, Dict, Any

app = FastAPI(title="HydroLab 3D - Computational Chemistry Engine")

# Add CORS middleware to allow cross-origin requests from the React frontend or Node proxy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Atom3D(BaseModel):
    element: str
    x: float
    y: float
    z: float

class Bond(BaseModel):
    source: int
    target: int
    type: float

class MoleculeResponse(BaseModel):
    name: str
    smiles: str
    formula: str
    exact_mass: float
    log_p: float
    h_donors: int
    h_acceptors: int
    atoms: List[Atom3D]
    bonds: List[Bond]

FALLBACK_SMILES = {
    "aspirin": "CC(=O)OC1=CC=CC=C1C(=O)O",
    "caffeine": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    "water": "O",
    "methane": "C",
    "ethanol": "CCO",
    "benzene": "C1=CC=CC=C1",
    "paracetamol": "CC(=O)NC1=CC=C(O)C=C1",
    "tnt": "CC1=C(C=C(C=C1[N+](=O)[O-])[N+](=O)[O-])[N+](=O)[O-]"
}

def get_smiles_from_name(name: str) -> str:
    """Fetch SMILES string from PubChem given a common molecule name."""
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{name}/property/CanonicalSMILES/JSON"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data['PropertyTable']['Properties'][0]['CanonicalSMILES']
    except Exception:
        pass
        
    # Fallback if PubChem is down or molecule not found
    name_lower = name.lower()
    if name_lower in FALLBACK_SMILES:
        return FALLBACK_SMILES[name_lower]
        
    raise HTTPException(status_code=404, detail=f"Molecule '{name}' not found in PubChem and no fallback available.")

@app.get("/api/molecule/{name}", response_model=MoleculeResponse)
def analyze_molecule(name: str):
    try:
        smiles = get_smiles_from_name(name)
        
        # Parse SMILES into RDKit Mol
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise HTTPException(status_code=400, detail="Invalid SMILES string generated.")
        
        # Add Explicit Hydrogens for 3D coordinate generation
        mol = Chem.AddHs(mol)
        
        # Compute properties
        exact_mass = Descriptors.ExactMolWt(mol)
        log_p = Descriptors.MolLogP(mol)
        h_donors = Descriptors.NumHDonors(mol)
        h_acceptors = Descriptors.NumHAcceptors(mol)
        formula = Chem.rdMolDescriptors.CalcMolFormula(mol)
        
        # Add explicit hydrogens for 3D coordinate generation
        mol = Chem.AddHs(mol)
        
        # Generate 3D coordinates
        try:
            # Generate starting coordinates using ETKDG (standard method)
            AllChem.EmbedMolecule(mol, AllChem.ETKDG())
            # Optimize the geometry using MMFF94 force field
            AllChem.MMFFOptimizeMolecule(mol)
        except Exception:
            pass # Ignore if optimization fails

        # Extract atoms and 3D coordinates
        conf = mol.GetConformer()
        atoms = []
        for i, atom in enumerate(mol.GetAtoms()):
            pos = conf.GetAtomPosition(i)
            atoms.append({
                "element": atom.GetSymbol(),
                "x": pos.x,
                "y": pos.y,
                "z": pos.z
            })
            
        # Extract bonds
        bonds = []
        for bond in mol.GetBonds():
            bonds.append({
                "source": bond.GetBeginAtomIdx(),
                "target": bond.GetEndAtomIdx(),
                "type": bond.GetBondTypeAsDouble()
            })
            
        return {
            "name": name,
            "smiles": smiles,
            "formula": formula,
            "exact_mass": round(exact_mass, 4),
            "log_p": round(log_p, 4),
            "h_donors": h_donors,
            "h_acceptors": h_acceptors,
            "atoms": atoms,
            "bonds": bonds
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SmilesRequest(BaseModel):
    name: str
    smiles: str

@app.post("/api/molecule/smiles", response_model=MoleculeResponse)
def analyze_from_smiles(req: SmilesRequest):
    try:
        mol = Chem.MolFromSmiles(req.smiles)
        if mol is None:
            raise HTTPException(status_code=400, detail="Invalid SMILES string generated.")
        
        mol = Chem.AddHs(mol)
        
        exact_mass = Descriptors.ExactMolWt(mol)
        log_p = Descriptors.MolLogP(mol)
        h_donors = Descriptors.NumHDonors(mol)
        h_acceptors = Descriptors.NumHAcceptors(mol)
        formula = Chem.rdMolDescriptors.CalcMolFormula(mol)
        
        mol = Chem.AddHs(mol)
        
        try:
            AllChem.EmbedMolecule(mol, AllChem.ETKDG())
            AllChem.MMFFOptimizeMolecule(mol)
        except Exception:
            pass

        conf = mol.GetConformer()
        atoms = []
        for i, atom in enumerate(mol.GetAtoms()):
            pos = conf.GetAtomPosition(i)
            atoms.append({
                "element": atom.GetSymbol(),
                "x": pos.x,
                "y": pos.y,
                "z": pos.z
            })
            
        bonds = []
        for bond in mol.GetBonds():
            bonds.append({
                "source": bond.GetBeginAtomIdx(),
                "target": bond.GetEndAtomIdx(),
                "type": bond.GetBondTypeAsDouble()
            })
            
        return {
            "name": req.name,
            "smiles": req.smiles,
            "formula": formula,
            "exact_mass": round(exact_mass, 4),
            "log_p": round(log_p, 4),
            "h_donors": h_donors,
            "h_acceptors": h_acceptors,
            "atoms": atoms,
            "bonds": bonds
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "chemistry-engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
