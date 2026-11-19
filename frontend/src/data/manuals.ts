export interface Manual {
  id: string;
  title: string;
  description: string;
  content: {
    aim: string;
    apparatusAndReagents: string[];
    principle: string;
    procedure: string[];
    observations: string;
    calculations: string;
    safetyPrecautions: string[];
  };
}

export const manuals: Manual[] = [
  {
    id: 'hardness',
    title: 'Determination of Total Hardness',
    description: 'Learn the theoretical principles behind EDTA complexometric titrations and how water hardness is calculated.',
    content: {
      aim: 'To determine the total hardness of the given water sample using standard EDTA solution.',
      apparatusAndReagents: [
        'Burette (50 mL), Pipette (20 mL), Conical flask (250 mL).',
        'Standard EDTA solution (0.01 M).',
        'Eriochrome Black-T (EBT) indicator.',
        'Ammonia buffer solution (pH ~ 10).',
        'Water sample.'
      ],
      principle: 'Hardness of water is primarily due to the presence of dissolved calcium (Ca2+) and magnesium (Mg2+) salts. EDTA (Ethylenediaminetetraacetic acid) forms stable complexes with these alkaline earth metals. Eriochrome Black-T (EBT) is used as an indicator. At pH 10 (maintained using an ammonia buffer), EBT forms a wine-red, relatively unstable complex with Ca2+ and Mg2+. When EDTA is added from the burette, it extracts the metal ions from the EBT complex to form a highly stable, colorless metal-EDTA complex. This releases the free EBT indicator into the solution, which is steel-blue in color. The sharp color change from wine-red to steel-blue indicates the endpoint of the titration.',
      procedure: [
        'Wash the burette with distilled water and rinse it with the standard EDTA solution.',
        'Fill the burette with EDTA solution up to the zero mark without air bubbles.',
        'Pipette out exactly 20 mL of the given hard water sample into a clean conical flask.',
        'Add 2 mL of ammonia buffer solution to the flask to maintain the pH at approximately 10.',
        'Add 2-3 drops of Eriochrome Black-T (EBT) indicator. The solution will immediately turn wine-red.',
        'Carefully titrate the solution against the EDTA solution from the burette, swirling the flask continuously.',
        'Continue the dropwise addition of EDTA until the color of the solution changes sharply from wine-red to clear steel-blue.',
        'Record the final burette reading. This volume corresponds to the total hardness.',
        'Repeat the titration to obtain at least two concordant values.'
      ],
      observations: 'Tabulate Initial Burette Reading, Final Burette Reading, and Volume of EDTA consumed for multiple trials.',
      calculations: 'Total Hardness (in mg/L or ppm of CaCO3 equivalent) = (Volume of EDTA consumed × Molarity of EDTA × 100,000) / Volume of Water Sample.\nNote: 1 mL of 0.01 M EDTA is exactly equivalent to 1 mg of CaCO3.',
      safetyPrecautions: [
        'Ammonia buffer has a strong, pungent odor; avoid direct inhalation and handle in a well-ventilated area.',
        'EDTA and EBT are mild irritants; wash hands after handling.'
      ]
    }
  },
  {
    id: 'alkalinity',
    title: 'Determination of Alkalinity',
    description: 'Understand the types of alkalinity in water (hydroxide, carbonate, bicarbonate) and how they are neutralized.',
    content: {
      aim: 'To determine the phenolphthalein and methyl orange (total) alkalinity of the given water sample.',
      apparatusAndReagents: [
        'Burette (50 mL), Pipette (20 mL), Conical flask (250 mL).',
        'Standard Acid solution (e.g., 0.02 N HCl or H2SO4).',
        'Phenolphthalein indicator.',
        'Methyl Orange indicator.',
        'Water sample.'
      ],
      principle: 'Alkalinity in natural waters is mainly due to the presence of hydroxides (OH-), carbonates (CO3 2-), and bicarbonates (HCO3-). It is measured by titrating the water sample against a standard acid. Phenolphthalein indicator is used to detect hydroxide and exactly half of the carbonate alkalinity (color changes from pink to colorless at pH ~ 8.3). Methyl orange is then added to the same flask to determine the remaining half of the carbonate and all of the bicarbonate alkalinity (color changes from yellow to faint red/orange at pH ~ 4.5).',
      procedure: [
        'Fill the burette with the standard acid solution (0.02 N).',
        'Pipette exactly 20 mL of the water sample into a clean conical flask.',
        'Add 2-3 drops of phenolphthalein indicator. If the solution turns pink, OH- or CO3 2- is present. (If it remains colorless, phenolphthalein alkalinity is zero).',
        'Titrate with standard acid until the solution just becomes colorless. Note this volume as V1 (Phenolphthalein endpoint).',
        'To the exact same solution, add 2-3 drops of methyl orange indicator. The solution will turn yellow.',
        'Continue titrating with the standard acid from the V1 mark until the color changes from yellow to a faint red or orange. Note the total volume from zero as V2 (Total endpoint).',
        'Repeat the entire process to get concordant readings.'
      ],
      observations: 'Tabulate readings for Phenolphthalein endpoint (V1) and Total Methyl Orange endpoint (V2).',
      calculations: 'Phenolphthalein Alkalinity (P) = (V1 × Normality of Acid × 50,000) / Volume of Sample.\nTotal Alkalinity (T) = (V2 × Normality of Acid × 50,000) / Volume of Sample.\nConcentrations of specific ions (OH-, CO3 2-, HCO3-) are determined using standard P and T relationship tables.',
      safetyPrecautions: [
        'Standard acids (HCl, H2SO4) are corrosive. Handle with care and avoid skin contact.',
        'Always wear safety goggles when titrating strong acids.'
      ]
    }
  },
  {
    id: 'ph',
    title: 'Determination of pH',
    description: 'Explore the theory of pH, hydrogen ion concentration, and electrometric measurement using a pH meter.',
    content: {
      aim: 'To determine the pH of various water samples using a digital pH meter.',
      apparatusAndReagents: [
        'Digital pH meter with a combined glass electrode.',
        'Standard buffer solutions (pH 4.0, 7.0, and 9.2).',
        'Beakers (100 mL).',
        'Distilled water.',
        'Tissue paper.'
      ],
      principle: 'pH is defined as the negative logarithm (base 10) of the hydrogen ion activity/concentration: pH = -log[H+]. It quantitatively indicates the acidic or alkaline nature of water on a scale of 0 to 14. A digital pH meter measures the electrical potential difference between a pH-sensitive glass electrode and a reference electrode (such as calomel or Ag/AgCl) immersed in the solution. According to the Nernst equation, this potential difference is directly proportional to the pH of the solution.',
      procedure: [
        'Switch on the pH meter and allow it to warm up for 10-15 minutes.',
        'Calibrate the instrument using the standard buffer solution of pH 7.0 (set the zero/asymmetry control).',
        'Wash the electrode with distilled water, gently dab it dry with tissue paper, and dip it into the pH 4.0 or 9.2 buffer to adjust the slope.',
        'Once calibrated, wash and dry the electrode again.',
        'Dip the electrode into the given water sample in a beaker.',
        'Stir gently and wait for the reading on the digital display to stabilize.',
        'Record the final pH value.',
        'Rinse the electrode with distilled water and store it in the appropriate storage solution.'
      ],
      observations: 'Record the temperature and the stable pH reading from the digital display.',
      calculations: 'No manual titration calculations are required. However, the hydrogen ion concentration can be theoretically calculated as [H+] = 10^(-pH) moles/Liter.',
      safetyPrecautions: [
        'The glass electrode membrane is extremely fragile. Do not wipe it harshly; only dab gently.',
        'Never let the glass electrode dry out. Always store it in KCl solution.'
      ]
    }
  },
  {
    id: 'cod',
    title: 'Chemical Oxygen Demand (COD)',
    description: 'Analyze the amount of oxygen required to chemically oxidize organic compounds in water.',
    content: {
      aim: 'To determine the Chemical Oxygen Demand (COD) of the given wastewater sample.',
      apparatusAndReagents: [
        'COD Digestion apparatus (Reflux condenser).',
        'Standard Potassium Dichromate (K2Cr2O7) solution.',
        'Ferrous Ammonium Sulfate (FAS) standard solution.',
        'Concentrated Sulfuric acid (H2SO4) containing Silver Sulfate (Ag2SO4).',
        'Ferroin indicator.'
      ],
      principle: 'Chemical Oxygen Demand (COD) measures the oxygen equivalent of the organic matter in a water sample that is susceptible to oxidation by a strong chemical oxidant. Potassium dichromate (K2Cr2O7) in a boiling, strongly acidic medium (H2SO4) is used as the oxidant. Silver sulfate acts as a catalyst, and mercuric sulfate is added to complex chloride ions, preventing them from interfering. The sample is refluxed with a known excess of K2Cr2O7. The remaining unreacted K2Cr2O7 is then back-titrated with standard Ferrous Ammonium Sulfate (FAS) using ferroin indicator. The color changes sharply from blue-green to reddish-brown at the endpoint.',
      procedure: [
        'Take exactly 20 mL of the wastewater sample in a COD reflux flask.',
        'Add exactly 10 mL of standard K2Cr2O7 solution.',
        'Carefully add a pinch of mercuric sulfate (HgSO4) and slowly add 30 mL of conc. H2SO4 containing Ag2SO4.',
        'Attach the flask to the condenser and reflux the mixture on a hot plate for exactly 2 hours.',
        'Allow the flask to cool, wash the condenser down with distilled water, and detach the flask.',
        'Add 3-4 drops of ferroin indicator. The solution will appear blue-green.',
        'Titrate against standard FAS solution until the color changes sharply to reddish-brown. Note this volume as V1.',
        'Perform a "Blank Titration" using 20 mL of distilled water instead of the sample, following the exact same procedure. Note the FAS volume as V2.'
      ],
      observations: 'Record Blank titration volume (V2) and Sample titration volume (V1).',
      calculations: 'COD (in mg/L) = ((V2 - V1) × Normality of FAS × 8000) / Volume of Sample.',
      safetyPrecautions: [
        'Concentrated H2SO4 is highly corrosive and generates immense heat when mixed with water. Handle only inside a fume hood.',
        'Mercuric sulfate is highly toxic. Avoid direct contact and ensure proper hazardous waste disposal.'
      ]
    }
  },
  {
    id: 'do',
    title: 'Dissolved Oxygen (Winkler Method)',
    description: 'Determine the amount of oxygen dissolved in a water sample, a critical parameter for aquatic life.',
    content: {
      aim: 'To determine the amount of Dissolved Oxygen (DO) in the given water sample using Winkler’s iodometric method.',
      apparatusAndReagents: [
        'BOD bottle (300 mL), Burette, Pipettes.',
        'Manganous sulfate (MnSO4) solution.',
        'Alkaline iodide-azide reagent.',
        'Concentrated Sulfuric Acid (H2SO4).',
        'Standard Sodium Thiosulfate (Na2S2O3) solution.',
        'Starch indicator.'
      ],
      principle: 'Dissolved oxygen in water is fixed by adding manganous sulfate and an alkaline iodide-azide reagent. Under alkaline conditions, manganous ions (Mn2+) react with DO to form a brown precipitate of manganic hydroxide (Mn(OH)3 or MnO(OH)2). When strong acid (H2SO4) is added, the precipitate dissolves, and the manganic ions oxidize the iodide (I-) to free iodine (I2). The amount of iodine liberated is chemically equivalent to the original dissolved oxygen. This free iodine is then titrated against standard sodium thiosulfate using starch as an indicator, changing from dark blue to colorless at the endpoint.',
      procedure: [
        'Carefully fill a 300 mL BOD bottle completely with the water sample, avoiding any air bubbles.',
        'Quickly add 2 mL of MnSO4 solution followed by 2 mL of alkaline iodide-azide reagent, inserting the pipette tips well below the surface.',
        'Stopper the bottle carefully, excluding air bubbles, and invert it several times to mix. A brown flocculent precipitate indicates the presence of oxygen.',
        'Allow the precipitate to settle to the bottom half of the bottle.',
        'Remove the stopper and carefully add 2 mL of concentrated H2SO4 down the neck of the bottle.',
        'Restopper and invert gently until the precipitate dissolves completely, releasing a golden-brown iodine color.',
        'Measure out 50 mL or 100 mL of this fixed solution into a conical flask.',
        'Titrate with standard sodium thiosulfate (Na2S2O3) until the color fades to a pale straw yellow.',
        'Add 1-2 mL of starch indicator. The solution turns dark blue.',
        'Continue titrating dropwise until the blue color just disappears. Record the volume.'
      ],
      observations: 'Record the volume of standard Sodium Thiosulfate consumed.',
      calculations: 'DO (mg/L) = (Volume of Na2S2O3 × Normality of Na2S2O3 × 8 × 1000) / Volume of Sample Titrated.',
      safetyPrecautions: [
        'Azide compounds are highly toxic and can form explosive compounds if poured down metal drains. Dispose of safely.',
        'Handle concentrated sulfuric acid with extreme care.'
      ]
    }
  },
  {
    id: 'chloride',
    title: 'Chloride Determination (Mohr’s Method)',
    description: 'Measure the concentration of chloride ions in water, an indicator of salinity and pollution.',
    content: {
      aim: 'To determine the concentration of chloride ions in a water sample using Mohr’s argentometric titration.',
      apparatusAndReagents: [
        'Burette (50 mL), Conical flask (250 mL).',
        'Standard Silver Nitrate (AgNO3) solution.',
        'Potassium Chromate (K2CrO4) indicator.',
        'Water sample.'
      ],
      principle: 'Chloride ions (Cl-) in water can be determined by titrating against a standard solution of silver nitrate (AgNO3). Silver ions react with chloride ions to precipitate white silver chloride (AgCl). Potassium chromate (K2CrO4) is used as an indicator. Once all the chloride ions have been precipitated, any slight excess of silver ions reacts with the chromate ions to form a distinct reddish-brown precipitate of silver chromate (Ag2CrO4). The appearance of this reddish-brown color marks the endpoint. The titration must be carried out at a neutral or slightly alkaline pH (6.5 - 9.0).',
      procedure: [
        'Fill the burette with the standard Silver Nitrate (AgNO3) solution.',
        'Pipette 20 mL of the water sample into a conical flask.',
        'Check the pH of the sample. If it is highly acidic or alkaline, adjust it to pH 7-8 using dilute NaOH or HNO3.',
        'Add 1 mL of Potassium Chromate (K2CrO4) indicator. The solution will turn yellow.',
        'Titrate slowly with AgNO3, swirling constantly. A white precipitate of AgCl forms initially.',
        'Continue dropwise addition until a permanent faint reddish-brown tinge appears and persists.',
        'Record the burette reading.',
        'Perform a blank titration using distilled water to determine the indicator blank.'
      ],
      observations: 'Record the volume of AgNO3 consumed for the sample and the blank.',
      calculations: 'Chloride (mg/L) = ((Volume of sample - Volume of blank) × Normality of AgNO3 × 35.45 × 1000) / Volume of sample.',
      safetyPrecautions: [
        'Silver nitrate leaves persistent black stains on skin and clothing due to photoreduction. Wear gloves.',
        'Chromate compounds are toxic and potentially carcinogenic. Avoid contact and inhalation.'
      ]
    }
  },
  {
    id: 'turbidity',
    title: 'Determination of Turbidity',
    description: 'Learn how suspended particles scatter light and how nephelometry is used to measure water clarity.',
    content: {
      aim: 'To measure the turbidity of the given water sample using a Nephelometer.',
      apparatusAndReagents: [
        'Nephelometric Turbidity Meter.',
        'Sample cells/cuvettes.',
        'Standard Formazin solutions (e.g., 10 NTU, 100 NTU, 400 NTU).',
        'Distilled water (for blank).'
      ],
      principle: 'Turbidity is an expression of the optical property that causes light to be scattered and absorbed rather than transmitted in straight lines through a water sample. It is caused by suspended matter or impurities. A nephelometer measures the intensity of light scattered at an angle (usually 90 degrees) to the incident light beam. The intensity of scattered light is directly proportional to the turbidity of the sample. The unit of measurement is the Nephelometric Turbidity Unit (NTU), calibrated using standard Formazin polymer suspensions.',
      procedure: [
        'Switch on the Nephelometer and allow it to warm up.',
        'Select the appropriate measurement range.',
        'Clean a cuvette, fill it with distilled water (zero turbidity), insert it into the cell holder, and set the reading to 00.0 NTU.',
        'Remove the blank cuvette. Fill another cuvette with a known Formazin standard (e.g., 100 NTU).',
        'Insert the standard cuvette and calibrate the meter to read exactly 100 NTU.',
        'Rinse a cuvette with the water sample to be tested.',
        'Fill the cuvette with the sample, wipe the outside completely dry and free of fingerprints.',
        'Insert the sample cuvette into the meter and wait for the reading to stabilize.',
        'Record the turbidity in NTU.'
      ],
      observations: 'Record the NTU reading directly from the digital display.',
      calculations: 'No calculations are required as the instrument directly provides the reading in NTU.',
      safetyPrecautions: [
        'Ensure the outside of the cuvette is perfectly clean; fingerprints or scratches will cause false scattering and inaccurate readings.',
        'Handle Formazin standards carefully as hydrazine sulfate (used in preparation) is toxic.'
      ]
    }
  },
  {
    id: 'bod',
    title: 'Biological Oxygen Demand (BOD)',
    description: 'Understand the biological degradation of organic matter by aerobic microorganisms over 5 days.',
    content: {
      aim: 'To determine the Biological Oxygen Demand (BOD) of the given wastewater sample after 5 days of incubation at 20°C.',
      apparatusAndReagents: [
        'BOD Incubator (set to 20°C).',
        'BOD bottles (300 mL) with air-tight stoppers.',
        'Dilution water (aerated water containing nutrient buffers: phosphate, magnesium sulfate, calcium chloride, and ferric chloride).',
        'Reagents for Dissolved Oxygen (DO) determination (Winkler Method).'
      ],
      principle: 'Biological Oxygen Demand (BOD) is the amount of dissolved oxygen consumed by aerobic microorganisms while stabilizing organic matter under aerobic conditions at a specific temperature (usually 20°C) over a specific period (usually 5 days). The test measures the difference between the initial dissolved oxygen (DO_0) of a diluted sample and the final dissolved oxygen (DO_5) after 5 days of incubation. Since the oxygen demand of wastewater exceeds the solubility of oxygen in water, the sample must be diluted with heavily aerated, nutrient-rich dilution water before incubation.',
      procedure: [
        'Prepare aerated dilution water by adding 1 mL each of phosphate buffer, MgSO4, CaCl2, and FeCl3 solutions per liter of distilled water.',
        'Depending on the expected BOD, prepare a specific dilution of the wastewater sample (e.g., 1% or 5%) in a large volumetric flask using the dilution water.',
        'Carefully siphon the diluted sample into two separate 300 mL BOD bottles without entraining air bubbles.',
        'Determine the initial Dissolved Oxygen (DO_0) immediately on the first bottle using the Winkler titration method.',
        'Stopper the second bottle tightly, ensure a water seal around the neck, and place it in the BOD incubator at exactly 20°C.',
        'After exactly 5 days, remove the bottle and determine the final Dissolved Oxygen (DO_5) using the Winkler titration method.',
        'Perform a blank determination by incubating pure dilution water to check for oxygen depletion without the sample.'
      ],
      observations: 'Record Initial DO (DO_0) in mg/L, Final DO (DO_5) in mg/L, and the Dilution Factor.',
      calculations: 'BOD5 (mg/L) = (DO_0 - DO_5) × Dilution Factor.\nWhere Dilution Factor = (Volume of Diluted Sample) / (Volume of Original Wastewater Sample).',
      safetyPrecautions: [
        'Raw wastewater samples may contain pathogens. Wear gloves and practice strict laboratory hygiene.',
        'Ensure the water seal in the incubator does not evaporate, as air ingress will invalidate the test.'
      ]
    }
  }
];
