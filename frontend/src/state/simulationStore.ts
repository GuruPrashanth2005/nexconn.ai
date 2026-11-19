import * as THREE from 'three';
/* eslint-disable */
import { create } from 'zustand';
import {
  generateEndpoint,
  calculateSolutionColor as calculateHardnessColor,
  type SolutionColor
} from '../logic/chemistryEngine';
import { evaluateTitration, evaluatePHDetermination, type ScoreReport } from '../logic/scoringEngine';
import { generateAlkalinityEndpoints, calculateAlkalinityColor, evaluateAlkalinityTitration } from '../logic/alkalinityEngine';
import { generateCODEndpoints, calculateCODColor, evaluateCODTitration } from '../logic/codEngine';

export interface TimelineEvent {
  id: string;
  time: string;
  description: string;
}

export type ExperimentModule = 'HARDNESS' | 'ALKALINITY' | 'COD' | 'PH';
export type ExperimentMode = 'PRACTICE' | 'ASSESSMENT';

export interface SimulationState {
  // Module Config
  activeModule: ExperimentModule | null;
  activeMode: ExperimentMode | null;
  assessmentStartTime: number | null;
  endpoint: number; // Hardness endpoint
  endpointA: number; // Alkalinity Phenolphthalein endpoint
  endpointB: number; // Alkalinity Methyl Orange endpoint
  endpointCODBlank: number;
  endpointCODSample: number;
  codActiveStation: 'SAMPLE' | 'BLANK' | null;

  safetyBriefingRead: boolean;
  instructorMode: boolean;
  isExperimentSubmitted: boolean;
  score: number | null;
  evaluationReport: ScoreReport | null;

  // Companion AI State
  chatHistory: { role: 'user' | 'assistant' | 'system', content: string }[];
  isAiTyping: boolean;
  isCompanionOpen: boolean;
  companionPosition: 'center' | 'burette' | 'flask' | 'default';
  popupMessage: string | null;
  cameraFocusTarget: THREE.Vector3 | null;

  isExperimentFailed: boolean;
  failureReason: string;
  timelineEvents: TimelineEvent[];
  theme: 'dark' | 'light';
  showAllLabels: boolean;

  // Reagents & Flask Setup
  selectedEquipment: string | null;
  activePipetteLiquid: 'WATER' | 'DISTILLED' | null;
  
  // Basic titration state
  isBuretteFilled: boolean;
  flaskHasSample: boolean;
  flaskSampleVolume: number;
  flaskTitrantVolume: number;
  
  // Indicators
  flaskHasIndicator: boolean; // For EBT
  flaskIndicatorType: 'EBT' | 'OTHER' | null;
  flaskHasPhenol: boolean; // For Alkalinity
  flaskHasMethyl: boolean; // For Alkalinity

  // COD Specific State
  sampleHasWater: boolean;
  sampleHasK2Cr2O7: boolean;
  sampleHasH2SO4: boolean;
  sampleHasFerroin: boolean;
  sampleIsRefluxing: boolean;
  sampleRefluxCompleted: boolean;
  sampleTitrantVolume: number;
  sampleBuretteFilled: boolean;

  blankHasWater: boolean;
  blankHasK2Cr2O7: boolean;
  blankHasH2SO4: boolean;
  blankHasFerroin: boolean;
  blankIsRefluxing: boolean;
  blankRefluxCompleted: boolean;
  blankTitrantVolume: number;
  blankBuretteFilled: boolean;

  phMeterPowerOn: boolean;
  phMeterCalibrated: boolean;
  phMeterCurrentReading: number | null;
  phElectrodeSubmergedIn: 'BUFFER_4' | 'BUFFER_7' | 'BUFFER_10' | 'SAMPLE' | null;
  phElectrodeClean: boolean;
  phTrueSampleValue: number;
  phCalibrationOffset: number;

  togglePHPower: () => void;
  calibratePHMeter: () => void;
  cleanElectrode: () => void;
  moveElectrode: (target: 'BUFFER_4' | 'BUFFER_7' | 'BUFFER_10' | 'SAMPLE' | null) => void;
  setPHReading: (reading: number | null) => void;

  userPHResult: string;

  // Titration Mechanics
  isStopcockOpen: boolean;
  stopcockOperatorId: string | null;
  flowMode: 'continuous' | 'dropwise';
  isSwirling: boolean;
  lastSwirlVolume: number;
  swirlTimer: any | null;
  welcomeTimer: any | null;

  // Real-time Warnings & Colors
  solutionColor: SolutionColor;
  warningMessage: string | null;

  // Logbook Entries
  userInitialReading: string;
  userFinalReading: string; // Hardness final
  userHardnessInput: string;

  // Alkalinity Logbook
  userFinalReadingA: string;
  userFinalReadingB: string;
  userPAInput: string;
  userTAInput: string;
  userOHInput: string;
  userCO3Input: string;
  userHCO3Input: string;

  // COD Logbook
  userCODInitialSample: string;
  userCODEndpointSample: string;
  userCODInitialBlank: string;
  userCODEndpointBlank: string;
  userCODResult: string;

  // Procedure Checklist
  checklist: Record<string, boolean>;

  // Scoring Metrics
  usedDropwiseNearEndpoint: boolean;
  swirledNearEndpoint: boolean;

  // Actions
  selectModule: (module: ExperimentModule, mode: ExperimentMode) => void;
  exitModule: () => void;
  resetSimulation: () => void;
  toggleInstructorMode: () => void;
  toggleTheme: () => void;
  toggleShowAllLabels: () => void;
  readSafetyBriefing: () => void;
  selectEquipment: (equip: string | null) => void;
  addTimelineEvent: (desc: string) => void;
  
  // Interaction Steps
  pipetteDraw: () => void;
  pipetteDispense: () => void;
  addIndicatorToFlask: (type: 'EBT' | 'PHENOL' | 'METHYL' | 'FERROIN') => void;
  fillBurette: () => void;
  
  // COD specific
  switchCODStation: (station: 'SAMPLE' | 'BLANK') => void;
  addK2Cr2O7: () => void;
  addH2SO4: () => void;
  startReflux: () => void;
  finishReflux: () => void;
  
  // Titration controls
  toggleStopcock: () => void;
  setFlowMode: (mode: 'continuous' | 'dropwise') => void;
  triggerDrop: () => void;
  triggerSwirl: () => void;
  tickTitration: (dtSeconds: number) => void;
  
  // Logbook and Submission
  updateLogbook: (field: string, value: string) => void;
  submitExperiment: () => void;
  failExperiment: (reason: string) => void;

  // AI Actions
  addChatMessage: (role: 'user' | 'assistant' | 'system', content: string) => void;
  setAiTyping: (isTyping: boolean) => void;
  setEvaluationReport: (report: ScoreReport | null) => void;
  setCompanionOpen: (isOpen: boolean) => void;
  setPopupMessage: (msg: string | null) => void;
  showCompanionMessage: (msg: string, position?: 'center' | 'burette' | 'flask' | 'default') => void;
  setCameraFocusTarget: (target: THREE.Vector3 | null) => void;
  triggerAIIntervention: (mistakeContext: string, position?: 'center' | 'burette' | 'flask' | 'default') => void;

  // Agentic Tools
  activeHazard: string | null;
  highlightedEquipment: string | null;
  triggerHazard: (hazardType: string) => void;
  clearHazard: () => void;
  highlightEquipment: (itemName: string) => void;
  clearHighlight: () => void;

  // AI Warning Flags
  aiWarnedNearEndpoint: boolean;
  aiWarnedDropwise: boolean;
  aiWarnedEndpointHit: boolean;
  aiWarnedSwirl: boolean;
  aiWarnedLowTitrant: boolean;
}

const formatTime = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
};

const defaultChecklist = {
  readBriefing: false, selectTitrant: false, fillBurette: false, pipetteSample: false,
  addIndicator1: false, startTitration: false, swirlFlask: false, slowNearEndpoint: false,
  stopAtEndpoint: false, recordReading1: false, submitCalculation: false,
  addIndicator2: false, recordReading2: false,
  
  // New COD specific checklist
  codSamplePipette: false,
  codSampleK2Cr2O7: false,
  codSampleH2SO4: false,
  codSampleStartReflux: false,
  codSampleCompleteReflux: false,
  codSampleFillBurette: false,
  codSampleAddFerroin: false,
  codSampleTitrateToWineRed: false,
  codSampleRecordV2: false,

  codBlankPipette: false,
  codBlankK2Cr2O7: false,
  codBlankH2SO4: false,
  codBlankStartReflux: false,
  codBlankCompleteReflux: false,
  codBlankFillBurette: false,
  codBlankAddFerroin: false,
  codBlankTitrateToWineRed: false,
  codBlankRecordV1: false,

  phTurnOnMeter: false,
  phCleanElectrode1: false,
  phCalibrate7: false,
  phCleanElectrode2: false,
  phCalibrate4: false,
  phCleanElectrode3: false,
  phMeasureSample: false,
  phRecordResult: false,
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  activeModule: null,
  activeMode: null,
  assessmentStartTime: null,
  endpoint: 0,
  endpointA: 0,
  endpointB: 0,
  endpointCODBlank: 0,
  endpointCODSample: 0,
  codActiveStation: null,
  
  safetyBriefingRead: false,
  instructorMode: false,
  isExperimentSubmitted: false,
  score: null,
  evaluationReport: null,
  chatHistory: [],
  isAiTyping: false,
  isCompanionOpen: false,
  companionPosition: 'default',
  popupMessage: null,
  cameraFocusTarget: null,
  isExperimentFailed: false,
  failureReason: '',
  timelineEvents: [],
  theme: 'dark',
  showAllLabels: true,

  activeHazard: null,
  highlightedEquipment: null,

  aiWarnedNearEndpoint: false,
  aiWarnedDropwise: false,
  aiWarnedEndpointHit: false,
  aiWarnedSwirl: false,
  aiWarnedLowTitrant: false,

  selectedEquipment: null,
  activePipetteLiquid: null,
  
  isBuretteFilled: false,
  flaskHasSample: false,
  flaskSampleVolume: 0,
  flaskTitrantVolume: 0,
  
  flaskHasIndicator: false,
  flaskIndicatorType: null,
  flaskHasPhenol: false,
  flaskHasMethyl: false,

  sampleHasWater: false,
  sampleHasK2Cr2O7: false,
  sampleHasH2SO4: false,
  sampleHasFerroin: false,
  sampleIsRefluxing: false,
  sampleRefluxCompleted: false,
  sampleTitrantVolume: 0,
  sampleBuretteFilled: false,

  blankHasWater: false,
  blankHasK2Cr2O7: false,
  blankHasH2SO4: false,
  blankHasFerroin: false,
  blankIsRefluxing: false,
  blankRefluxCompleted: false,
  blankTitrantVolume: 0,
  blankBuretteFilled: false,

  phMeterPowerOn: false,
  phMeterCalibrated: false,
  phMeterCurrentReading: null,
  phElectrodeSubmergedIn: null,
  phElectrodeClean: true,
  phTrueSampleValue: 7.0,
  phCalibrationOffset: 0,
  userPHResult: '',

  isStopcockOpen: false,
  stopcockOperatorId: null,
  flowMode: 'continuous',
  isSwirling: false,
  lastSwirlVolume: 0,
  swirlTimer: null,
  welcomeTimer: null,

  solutionColor: { hex: '#ffffff', opacity: 0.0, isStable: true },
  warningMessage: null,

  userInitialReading: '',
  userFinalReading: '',
  userHardnessInput: '',
  userFinalReadingA: '',
  userFinalReadingB: '',
  userPAInput: '',
  userTAInput: '',
  userOHInput: '',
  userCO3Input: '',
  userHCO3Input: '',
  userCODInitialSample: '',
  userCODEndpointSample: '',
  userCODInitialBlank: '',
  userCODEndpointBlank: '',
  userCODResult: '',

  checklist: { ...defaultChecklist },

  usedDropwiseNearEndpoint: false,
  swirledNearEndpoint: false,

  selectModule: (module, mode) => {
    const alkE = generateAlkalinityEndpoints();
    const codE = generateCODEndpoints();
    set({
      activeModule: module,
      activeMode: mode,
      assessmentStartTime: mode === 'ASSESSMENT' ? Date.now() : null,
      endpoint: generateEndpoint(),
      endpointA: alkE.endpointA,
      endpointB: alkE.endpointB,
      endpointCODBlank: codE.endpointBlank,
      endpointCODSample: codE.endpointSample,
      codActiveStation: module === 'COD' ? 'SAMPLE' : null,
      safetyBriefingRead: true, // Handled by ModuleSelector before entering
      checklist: { ...defaultChecklist, readBriefing: true },
      timelineEvents: [{ id: Math.random().toString(), time: formatTime(), description: `Module selected: ${module}` }],
      isExperimentSubmitted: false,
      score: null,
      evaluationReport: null,
      chatHistory: [],
      isAiTyping: false,
      isCompanionOpen: false,
      companionPosition: 'default',
      popupMessage: null,
  cameraFocusTarget: null,
    });
    get().resetSimulation();

    // Tour guide hook on entry
    const s = get();
    if (s.welcomeTimer) clearTimeout(s.welcomeTimer);

    if (mode === 'PRACTICE') {
      const timer = setTimeout(() => {
        const msg = module === 'PH' 
          ? `just entered the ${module} module. Welcome them to the experiment and tell them the first step is to turn on the pH meter on the table.`
          : `just entered the ${module} module. Welcome them to the experiment and tell them the first step is to click the titrant bottle on the table to fill the burette.`;
        get().triggerAIIntervention(msg, 'center');
      }, 1500);
      set({ welcomeTimer: timer });
    }
  },

  exitModule: () => {
    set({
      activeModule: null,
      activeMode: null,
      assessmentStartTime: null,
      isExperimentFailed: false,
      failureReason: '',
      isExperimentSubmitted: false,
      score: null,
      evaluationReport: null,
      chatHistory: [],
      isAiTyping: false,
      isCompanionOpen: false,
      companionPosition: 'default',
      popupMessage: null,
      cameraFocusTarget: null,
    });
  },

  resetSimulation: () => {
    const state = get();
    if (state.swirlTimer) clearTimeout(state.swirlTimer);
    
    const alkE = generateAlkalinityEndpoints();
    const codE = generateCODEndpoints();

    set({
      endpoint: generateEndpoint(),
      endpointA: alkE.endpointA,
      endpointB: alkE.endpointB,
      endpointCODBlank: codE.endpointBlank,
      endpointCODSample: codE.endpointSample,
      codActiveStation: state.activeModule === 'COD' ? 'SAMPLE' : null,
      
      isExperimentSubmitted: false,
      isExperimentFailed: false,
      failureReason: '',
      timelineEvents: [{ id: Math.random().toString(), time: formatTime(), description: 'Experiment reset.' }],
      selectedEquipment: null,
      activePipetteLiquid: null,
      
      isBuretteFilled: false,
      flaskHasSample: false,
      flaskSampleVolume: 0,
      flaskTitrantVolume: 0,
      
      flaskHasIndicator: false,
      flaskIndicatorType: null,
      flaskHasPhenol: false,
      flaskHasMethyl: false,
      
      sampleHasWater: false,
      sampleHasK2Cr2O7: false,
      sampleHasH2SO4: false,
      sampleHasFerroin: false,
      sampleIsRefluxing: false,
      sampleRefluxCompleted: false,
      sampleTitrantVolume: 0,
      sampleBuretteFilled: false,

      blankHasWater: false,
      blankHasK2Cr2O7: false,
      blankHasH2SO4: false,
      blankHasFerroin: false,
      blankIsRefluxing: false,
      blankRefluxCompleted: false,
      blankTitrantVolume: 0,
      blankBuretteFilled: false,

      phMeterPowerOn: false,
      phMeterCalibrated: false,
      phMeterCurrentReading: null,
      phElectrodeSubmergedIn: null,
      phElectrodeClean: true,
      phTrueSampleValue: Math.random() > 0.5 ? 6.5 + Math.random() * 2.0 : 7.0,
      phCalibrationOffset: 0,

      isStopcockOpen: false,
      stopcockOperatorId: null,
      flowMode: 'continuous',
      isSwirling: false,
      lastSwirlVolume: 0,
      solutionColor: { hex: '#e2e8f0', opacity: 0.4, isStable: true },
      warningMessage: null,
      
      userInitialReading: '',
      userFinalReading: '',
      userHardnessInput: '',
      userFinalReadingA: '',
      userFinalReadingB: '',
      userPAInput: '',
      userTAInput: '',
      userOHInput: '',
      userCO3Input: '',
      userHCO3Input: '',
      userCODInitialSample: '',
      userCODEndpointSample: '',
      userCODInitialBlank: '',
      userCODEndpointBlank: '',
      userCODResult: '',
      evaluationReport: null,
      
      checklist: { ...defaultChecklist, readBriefing: state.safetyBriefingRead },
      usedDropwiseNearEndpoint: false,
      swirledNearEndpoint: false,
      
      activeHazard: null,
      highlightedEquipment: null,

      aiWarnedNearEndpoint: false,
      aiWarnedDropwise: false,
      aiWarnedEndpointHit: false,
      aiWarnedSwirl: false,
      aiWarnedLowTitrant: false,
    });
    get().tickTitration(0);
  },

  toggleInstructorMode: () => set((state) => ({ instructorMode: !state.instructorMode })),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  toggleShowAllLabels: () => set((state) => ({ showAllLabels: !state.showAllLabels })),
  
  triggerHazard: (hazardType) => set({ activeHazard: hazardType }),
  clearHazard: () => set({ activeHazard: null }),
  highlightEquipment: (itemName) => set({ highlightedEquipment: itemName }),
  clearHighlight: () => set({ highlightedEquipment: null }),

  readSafetyBriefing: () => set((state) => ({ safetyBriefingRead: true, checklist: { ...state.checklist, readBriefing: true } })),
  
  selectEquipment: (equip) => {
    set({ selectedEquipment: equip });
    let updatedChecklist = { ...get().checklist };
    if (equip === 'EDTA_BOTTLE' || equip === 'HCL_BOTTLE') {
      updatedChecklist.selectTitrant = true;
      set({ checklist: updatedChecklist });
    }

    // Broadcast equipment selection and checklist step
    import('../services/nexconnManager').then(({ default: NexconnManager }) => {
      NexconnManager.getInstance().broadcastProcedureStep({
        checklist: updatedChecklist,
        selectedEquipment: equip,
      });
    });
  },

  addTimelineEvent: (desc) => {
    const newEvent: TimelineEvent = { id: Math.random().toString(), time: formatTime(), description: desc };
    set((state) => ({ timelineEvents: [newEvent, ...state.timelineEvents].slice(0, 50) }));
  },

  pipetteDraw: () => {
    const s = get();
    if (s.selectedEquipment !== 'PIPETTE') return set({ warningMessage: 'Select pipette first.' });
    const liquid = (s.activeModule === 'COD' && s.codActiveStation === 'BLANK') ? 'DISTILLED' : 'WATER';
    set({ activePipetteLiquid: liquid, warningMessage: null });

    // Broadcast pipette draw
    import('../services/nexconnManager').then(({ default: NexconnManager }) => {
      NexconnManager.getInstance().broadcastProcedureStep({
        checklist: get().checklist,
        activePipetteLiquid: liquid,
      });
    });
  },

  pipetteDispense: () => {
    const s = get();
    if (!s.activePipetteLiquid) return set({ warningMessage: 'Pipette is empty.' });
    
    if (s.activeModule === 'COD') {
      if (s.codActiveStation === 'SAMPLE') {
        if (s.activePipetteLiquid !== 'WATER') return set({ warningMessage: 'Need water sample for Sample Station.' });
        set((state) => ({ activePipetteLiquid: null, sampleHasWater: true, checklist: { ...state.checklist, codSamplePipette: true }, warningMessage: null }));
      } else {
        if (s.activePipetteLiquid !== 'DISTILLED') return set({ warningMessage: 'Need distilled water for Blank Station.' });
        set((state) => ({ activePipetteLiquid: null, blankHasWater: true, checklist: { ...state.checklist, codBlankPipette: true }, warningMessage: null }));
      }
    } else {
      set((state) => ({ activePipetteLiquid: null, flaskHasSample: true, flaskSampleVolume: 20, checklist: { ...state.checklist, pipetteSample: true }, warningMessage: null }));
      
      // Broadcast procedure sync via Nexconn
      import('../services/nexconnManager').then(({ default: NexconnManager }) => {
        NexconnManager.getInstance().broadcastProcedureStep({
          checklist: get().checklist,
          flaskHasSample: true,
        });
      });
    }
    get().tickTitration(0);
  },

  addIndicatorToFlask: (type) => {
    const s = get();
    if (s.activeModule === 'COD' && type === 'FERROIN') {
      if (s.codActiveStation === 'SAMPLE') {
        if (!s.sampleHasWater) return set({ warningMessage: 'Add water sample first.' });
        set((state) => ({ sampleHasFerroin: true, checklist: { ...state.checklist, codSampleAddFerroin: true } }));
      } else {
        if (!s.blankHasWater) return set({ warningMessage: 'Add blank solution first.' });
        set((state) => ({ blankHasFerroin: true, checklist: { ...state.checklist, codBlankAddFerroin: true } }));
      }
    } else {
      if (!s.flaskHasSample) return set({ warningMessage: 'Add water sample first.' });
      if (type === 'EBT') {
        set((state) => ({ flaskHasIndicator: true, flaskIndicatorType: 'EBT', checklist: { ...state.checklist, addIndicator1: true } }));
      } else if (type === 'PHENOL') {
        set((state) => ({ flaskHasPhenol: true, checklist: { ...state.checklist, addIndicator1: true } }));
      } else if (type === 'METHYL') {
        set((state) => ({ flaskHasMethyl: true, checklist: { ...state.checklist, addIndicator2: true } }));
      }

      // Broadcast procedure sync via Nexconn
      import('../services/nexconnManager').then(({ default: NexconnManager }) => {
        NexconnManager.getInstance().broadcastProcedureStep({
          checklist: get().checklist,
          flaskHasIndicator: true,
          flaskIndicatorType: type === 'EBT' ? 'EBT' : 'OTHER',
        });
      });
      if (s.activeMode === 'PRACTICE') {
        get().triggerAIIntervention(`just added the ${type} indicator to the flask. Congratulate them and tell them they are now ready to slowly open the burette stopcock.`, 'burette');
      }
    }
    get().tickTitration(0);
  },

  fillBurette: () => {
    const s = get();
    if (s.activeModule === 'COD') {
      if (s.codActiveStation === 'SAMPLE') {
        set((state) => ({ sampleBuretteFilled: true, checklist: { ...state.checklist, codSampleFillBurette: true }, warningMessage: null }));
      } else {
        set((state) => ({ blankBuretteFilled: true, checklist: { ...state.checklist, codBlankFillBurette: true }, warningMessage: null }));
      }
    } else {
      set((state) => ({ isBuretteFilled: true, checklist: { ...state.checklist, fillBurette: true }, warningMessage: null }));

      // Broadcast procedure sync via Nexconn
      import('../services/nexconnManager').then(({ default: NexconnManager }) => {
        NexconnManager.getInstance().broadcastProcedureStep({
          checklist: get().checklist,
          isBuretteFilled: true,
        });
      });
    }

    if (s.activeMode === 'PRACTICE') {
      get().triggerAIIntervention(`just successfully filled the burette. Congratulate them and tell them the next step is to add the chemical sample to the flask.`, 'flask');
    }
  },
  
  switchCODStation: (station) => {
    set({ codActiveStation: station });
    get().tickTitration(0);
  },

  addK2Cr2O7: () => {
    const s = get();
    if (s.codActiveStation === 'SAMPLE') {
      if (!s.sampleHasWater) return set({ warningMessage: 'Add water sample first.' });
      set((state) => ({ sampleHasK2Cr2O7: true, checklist: { ...state.checklist, codSampleK2Cr2O7: true }, warningMessage: null }));
    } else {
      if (!s.blankHasWater) return set({ warningMessage: 'Add blank solution first.' });
      set((state) => ({ blankHasK2Cr2O7: true, checklist: { ...state.checklist, codBlankK2Cr2O7: true }, warningMessage: null }));
    }
    get().tickTitration(0);
  },

  addH2SO4: () => {
    const s = get();
    if (s.codActiveStation === 'SAMPLE') {
      if (!s.sampleHasWater) return set({ warningMessage: 'Add water sample first.' });
      set((state) => ({ sampleHasH2SO4: true, checklist: { ...state.checklist, codSampleH2SO4: true }, warningMessage: null }));
    } else {
      if (!s.blankHasWater) return set({ warningMessage: 'Add blank solution first.' });
      set((state) => ({ blankHasH2SO4: true, checklist: { ...state.checklist, codBlankH2SO4: true }, warningMessage: null }));
    }
    get().tickTitration(0);
  },

  startReflux: () => {
    const s = get();
    if (s.codActiveStation === 'SAMPLE') {
      if (!s.sampleHasWater) return set({ warningMessage: 'Add water sample first.' });
      if (!s.sampleHasK2Cr2O7) return set({ warningMessage: 'Oxidizing agent (K₂Cr₂O₇) is required.' });
      if (!s.sampleHasH2SO4) return set({ warningMessage: 'Acidic medium (H₂SO₄) is required.' });
      set((state) => ({ sampleIsRefluxing: true, warningMessage: null, checklist: { ...state.checklist, codSampleStartReflux: true } }));
      get().addTimelineEvent('Sample Reflux started.');
      setTimeout(() => get().finishReflux(), 3000);
    } else {
      if (!s.blankHasWater) return set({ warningMessage: 'Add blank solution first.' });
      if (!s.blankHasK2Cr2O7) return set({ warningMessage: 'Oxidizing agent (K₂Cr₂O₇) is required.' });
      if (!s.blankHasH2SO4) return set({ warningMessage: 'Acidic medium (H₂SO₄) is required.' });
      set((state) => ({ blankIsRefluxing: true, warningMessage: null, checklist: { ...state.checklist, codBlankStartReflux: true } }));
      get().addTimelineEvent('Blank Reflux started.');
      setTimeout(() => get().finishReflux(), 3000);
    }
  },

  finishReflux: () => {
    const s = get();
    if (s.sampleIsRefluxing) {
      set((state) => ({ sampleIsRefluxing: false, sampleRefluxCompleted: true, checklist: { ...state.checklist, codSampleCompleteReflux: true } }));
      get().addTimelineEvent('Sample Reflux completed.');
    }
    if (s.blankIsRefluxing) {
      set((state) => ({ blankIsRefluxing: false, blankRefluxCompleted: true, checklist: { ...state.checklist, codBlankCompleteReflux: true } }));
      get().addTimelineEvent('Blank Reflux completed.');
    }
    get().tickTitration(0);
  },

  togglePHPower: () => {
    const s = get();
    set({ phMeterPowerOn: !s.phMeterPowerOn, checklist: { ...s.checklist, phTurnOnMeter: true } });
  },

  calibratePHMeter: () => {
    const s = get();
    if (!s.phMeterPowerOn) return set({ warningMessage: 'Turn on the pH meter first.' });
    if (!s.phElectrodeSubmergedIn) return set({ warningMessage: 'Submerge the electrode in a buffer solution to calibrate.' });
    
    if (s.phElectrodeSubmergedIn === 'BUFFER_7') {
      set((state) => ({ phMeterCalibrated: true, checklist: { ...state.checklist, phCalibrate7: true }, warningMessage: null }));
    } else if (s.phElectrodeSubmergedIn === 'BUFFER_4') {
      if (!s.checklist.phCalibrate7) return set({ warningMessage: 'Calibrate with pH 7 buffer first.' });
      set((state) => ({ checklist: { ...state.checklist, phCalibrate4: true }, warningMessage: null }));
    } else {
      set({ warningMessage: 'Can only calibrate using standard buffer solutions.' });
    }
  },

  cleanElectrode: () => {
    
    set((state) => {
      let checklistUpdates = { ...state.checklist };
      if (!state.checklist.phCleanElectrode1) checklistUpdates.phCleanElectrode1 = true;
      else if (!state.checklist.phCleanElectrode2 && state.checklist.phCalibrate7) checklistUpdates.phCleanElectrode2 = true;
      else if (!state.checklist.phCleanElectrode3 && state.checklist.phCalibrate4) checklistUpdates.phCleanElectrode3 = true;
      
      return { 
        phElectrodeSubmergedIn: null, 
        phElectrodeClean: true, 
        checklist: checklistUpdates, 
        warningMessage: null 
      };
    });
  },

  moveElectrode: (target: 'BUFFER_4' | 'BUFFER_7' | 'BUFFER_10' | 'SAMPLE' | null) => {
    const s = get();
    if (target && !s.phElectrodeClean) {
      set({ warningMessage: 'Warning: Electrode was not cleaned. Reading may be contaminated.' });
    }
    
    set((state) => {
      let checklistUpdates = { ...state.checklist };
      if (target === 'SAMPLE') checklistUpdates.phMeasureSample = true;
      
      return { 
        phElectrodeSubmergedIn: target,
        phElectrodeClean: target === null ? state.phElectrodeClean : false,
        checklist: checklistUpdates,
        warningMessage: target === null ? null : state.warningMessage
      };
    });
  },

  setPHReading: (reading: number | null) => {
    set({ phMeterCurrentReading: reading });
  },

  toggleStopcock: () => {
    const s = get();
    let isFilled = false;
    let refluxDone = false;
    
    if (s.activeModule === 'COD') {
      isFilled = s.codActiveStation === 'SAMPLE' ? s.sampleBuretteFilled : s.blankBuretteFilled;
      refluxDone = s.codActiveStation === 'SAMPLE' ? s.sampleRefluxCompleted : s.blankRefluxCompleted;
    } else {
      isFilled = s.isBuretteFilled;
    }

    if (!isFilled) {
      if (s.activeMode === 'PRACTICE') get().triggerAIIntervention("tried to open the stopcock, but the burette is empty.", 'burette');
      return set({ warningMessage: 'Fill burette first.' });
    }

    if (s.activeModule === 'HARDNESS') {
      if (!s.flaskHasSample) {
        if (s.activeMode === 'PRACTICE') get().triggerAIIntervention("tried to titrate, but the flask doesn't have the water sample yet.", 'flask');
        return set({ warningMessage: 'Pipette 20 ml water sample into the flask first.' });
      }
      if (!s.flaskHasIndicator) {
        if (s.activeMode === 'PRACTICE') get().triggerAIIntervention("tried to titrate without adding Eriochrome Black T (EBT) indicator.", 'flask');
        return set({ warningMessage: 'Add EBT Indicator to the flask before titrating.' });
      }
    }
    
    if (s.activeModule === 'ALKALINITY' && !s.flaskHasPhenol) {
      if (s.activeMode === 'PRACTICE') get().triggerAIIntervention("tried to start titrating Alkalinity without adding the Phenolphthalein indicator first.", 'flask');
      return set({ warningMessage: 'Phenolphthalein indicator is required for first endpoint detection.' });
    }
    if (s.activeModule === 'COD' && !refluxDone) {
      if (s.activeMode === 'PRACTICE') get().triggerAIIntervention("tried to titrate without finishing the reflux process.", 'flask');
      return set({ warningMessage: 'Reflux must be completed before titration.' });
    }

    const nextState = !s.isStopcockOpen;
    const currentOperator = s.stopcockOperatorId;

    import('../services/nexconnManager').then(({ default: NexconnManager }) => {
      const myId = NexconnManager.getInstance().getClientId();

      // If opening stopcock: allowed as long as not already open by someone else.
      // If closing stopcock: ALWAYS allowed so the user is never stuck unable to stop flow!
      if (!s.isStopcockOpen && currentOperator && currentOperator !== myId) {
        return;
      }

      const nextOperator = nextState ? myId : null;

      // 1. Update local store immediately
      set((state) => {
        let stopped = state.checklist.stopAtEndpoint;
        if (!nextState && state.activeModule === 'HARDNESS' && Math.abs(state.flaskTitrantVolume - state.endpoint) <= 0.3) {
          stopped = true;
        }
        return { 
          isStopcockOpen: nextState, 
          stopcockOperatorId: nextOperator,
          checklist: { ...state.checklist, startTitration: true, stopAtEndpoint: stopped }, 
          warningMessage: null 
        };
      });

      // 2. Broadcast immediately to peers
      NexconnManager.getInstance().broadcastFullSnapshot({
        isStopcockOpen: nextState,
        stopcockOperatorId: nextOperator,
        flaskTitrantVolume: get().flaskTitrantVolume,
        sampleTitrantVolume: get().sampleTitrantVolume,
        blankTitrantVolume: get().blankTitrantVolume,
        checklist: get().checklist,
      });
    });
  },

  setFlowMode: (mode) => set({ flowMode: mode }),

  triggerDrop: () => {
    const s = get();
    let isFilled = false;
    let vol = 0;
    
    if (s.activeModule === 'COD') {
      isFilled = s.codActiveStation === 'SAMPLE' ? s.sampleBuretteFilled : s.blankBuretteFilled;
      vol = s.codActiveStation === 'SAMPLE' ? s.sampleTitrantVolume : s.blankTitrantVolume;
    } else {
      isFilled = s.isBuretteFilled;
      vol = s.flaskTitrantVolume;
    }

    if (!isFilled) return;
    if (s.activeModule === 'HARDNESS' && (!s.flaskHasSample || !s.flaskHasIndicator)) {
      return set({ warningMessage: 'Sample and EBT Indicator required in flask first.' });
    }
    set({ isStopcockOpen: false });
    
    const newVolume = Math.min(25.0, vol + 0.05);
    const rounded = Math.round(newVolume * 100) / 100;

    // Broadcast live titration step to peer partner & supervisor
    import('../services/nexconnManager').then(({ default: NexconnManager }) => {
      NexconnManager.getInstance().broadcastTelemetry({
        roomId: NexconnManager.getInstance().getActiveRoom(),
        studentId: NexconnManager.getInstance().getUserId() || 'student_guru_2026',
        module: s.activeModule || 'HARDNESS',
        volumeDispensed: rounded,
        flaskColor: '#991b1b',
        isEndpointReached: false,
      });
    });
    
    let usedNear = s.usedDropwiseNearEndpoint;
    let stoppedAt = s.checklist.stopAtEndpoint;

    if (s.activeModule === 'HARDNESS') {
      if (Math.abs(s.endpoint - rounded) <= 1.5) usedNear = true;
      if (Math.abs(rounded - s.endpoint) <= 0.3) stoppedAt = true;
      set((state) => ({
        flaskTitrantVolume: rounded,
        usedDropwiseNearEndpoint: usedNear,
        checklist: { ...state.checklist, startTitration: true, slowNearEndpoint: usedNear || state.checklist.slowNearEndpoint, stopAtEndpoint: stoppedAt }
      }));
    } else if (s.activeModule === 'ALKALINITY') {
      if (Math.abs(s.endpointA - rounded) <= 1.5 || Math.abs(s.endpointB - rounded) <= 1.5) usedNear = true;
      set((state) => ({
        flaskTitrantVolume: rounded,
        usedDropwiseNearEndpoint: usedNear,
        checklist: { ...state.checklist, startTitration: true, slowNearEndpoint: usedNear || state.checklist.slowNearEndpoint }
      }));
    } else if (s.activeModule === 'COD') {
      const ep = s.codActiveStation === 'SAMPLE' ? s.endpointCODSample : s.endpointCODBlank;
      if (Math.abs(ep - rounded) <= 1.5) usedNear = true;
      
      const isEndpointMatched = Math.abs(rounded - ep) <= 0.3;
      
      if (s.codActiveStation === 'SAMPLE') {
        set((state) => ({
          sampleTitrantVolume: rounded,
          usedDropwiseNearEndpoint: usedNear,
          checklist: { ...state.checklist, codSampleTitrateToWineRed: state.checklist.codSampleTitrateToWineRed || isEndpointMatched }
        }));
      } else {
        set((state) => ({
          blankTitrantVolume: rounded,
          usedDropwiseNearEndpoint: usedNear,
          checklist: { ...state.checklist, codBlankTitrateToWineRed: state.checklist.codBlankTitrateToWineRed || isEndpointMatched }
        }));
      }
    }
    get().tickTitration(0);
  },

  triggerSwirl: () => {
    const s = get();
    if (s.swirlTimer) clearTimeout(s.swirlTimer);

    let swirledNear = s.swirledNearEndpoint;
    let vol = 0;
    
    if (s.activeModule === 'COD') {
      vol = s.codActiveStation === 'SAMPLE' ? s.sampleTitrantVolume : s.blankTitrantVolume;
      const ep = s.codActiveStation === 'SAMPLE' ? s.endpointCODSample : s.endpointCODBlank;
      if (Math.abs(vol - ep) <= 1.5) swirledNear = true;
    } else {
      vol = s.flaskTitrantVolume;
      if (s.activeModule === 'HARDNESS' && Math.abs(vol - s.endpoint) <= 1.5) swirledNear = true;
      if (s.activeModule === 'ALKALINITY' && (Math.abs(vol - s.endpointA) <= 1.5 || Math.abs(vol - s.endpointB) <= 1.5)) swirledNear = true;
    }

    const timer = setTimeout(() => set({ isSwirling: false }), 1500);
    set((state) => ({ isSwirling: true, lastSwirlVolume: vol, swirledNearEndpoint: swirledNear, swirlTimer: timer, checklist: { ...state.checklist, swirlFlask: true } }));
    get().tickTitration(0);

    // Mutual Swirl Broadcast: immediately mirror swirl to partner
    import('../services/nexconnManager').then(({ default: NexconnManager }) => {
      NexconnManager.getInstance().broadcastFullSnapshot({
        isSwirling: true,
        lastSwirlVolume: vol,
        checklist: get().checklist,
      });
      setTimeout(() => {
        NexconnManager.getInstance().broadcastFullSnapshot({
          isSwirling: false,
        });
      }, 1500);
    });
  },

  tickTitration: (dtSeconds) => {
    const s = get();
    if (s.isExperimentFailed) return;

    if (s.activeModule === 'COD') {
      const isSample = s.codActiveStation === 'SAMPLE';
      let currentVol = isSample ? s.sampleTitrantVolume : s.blankTitrantVolume;
      const ep = isSample ? s.endpointCODSample : s.endpointCODBlank;

      if (s.isStopcockOpen) {
        currentVol = Math.round(Math.min(25.0, currentVol + 0.35 * dtSeconds) * 100) / 100;
        if (currentVol > ep + 0.3) {
          get().failExperiment(`Overflow: ${isSample ? 'Sample' : 'Blank'} titration overshot by > 0.3 ml.`);
          return;
        }
        if (isSample) set({ sampleTitrantVolume: currentVol });
        else set({ blankTitrantVolume: currentVol });

        // Instant broadcast of continuous titration flow for COD
        const now = Date.now();
        if (typeof window !== 'undefined') {
          (window as any).__LAST_TITRANT_VOL = currentVol;
        }
        if (!(window as any).__last_telem_sent || now - (window as any).__last_telem_sent > 30) {
          (window as any).__last_telem_sent = now;
          const myId = s.stopcockOperatorId || (typeof window !== 'undefined' ? (window as any).__HYD_CLIENT_ID : '');

          const telemPacket = {
            type: 'TELEMETRY' as const,
            roomId: (typeof window !== 'undefined' && (window as any).__CURRENT_ROOM_ID) || 'LAB-COD-402',
            studentId: 'student_guru_2026',
            clientId: myId,
            module: 'COD',
            volumeDispensed: currentVol,
            isStopcockOpen: true,
            stopcockOperatorId: myId,
            flaskColor: '#991b1b',
            isEndpointReached: currentVol >= ep,
            timestamp: now
          };

          try {
            if ((window as any).__nexconn_channel) {
              (window as any).__nexconn_channel.postMessage(telemPacket);
            }
          } catch {}

          import('../services/nexconnManager').then(({ default: NexconnManager }) => {
            const mgr = NexconnManager.getInstance();
            if (!(window as any).__nexconn_channel) {
              (window as any).__nexconn_channel = mgr.getBroadcastChannel();
            }
            mgr.broadcastTelemetry({
              roomId: mgr.getActiveRoom(),
              studentId: mgr.getUserId() || 'student_guru_2026',
              module: 'COD',
              volumeDispensed: currentVol,
              isStopcockOpen: true,
              stopcockOperatorId: s.stopcockOperatorId,
              flaskColor: '#991b1b',
              isEndpointReached: currentVol >= ep,
            });
          });
        }
      }

      const colorReport = calculateCODColor(
        currentVol, ep, 
        isSample ? s.sampleHasWater : s.blankHasWater,
        isSample ? s.sampleHasK2Cr2O7 : s.blankHasK2Cr2O7, 
        isSample ? s.sampleHasH2SO4 : s.blankHasH2SO4, 
        isSample ? s.sampleHasFerroin : s.blankHasFerroin,
        isSample ? s.sampleRefluxCompleted : s.blankRefluxCompleted, 
        s.isSwirling, s.lastSwirlVolume
      );
      set({ solutionColor: colorReport, warningMessage: colorReport.message || null });

    } else {
      let currentVol = s.flaskTitrantVolume;
      if (s.isStopcockOpen) {
        currentVol = Math.round(Math.min(25.0, s.flaskTitrantVolume + 0.35 * dtSeconds) * 100) / 100;
        if (s.activeModule === 'HARDNESS' && currentVol > s.endpoint + 0.3) {
          get().failExperiment('Overflow: Hardness endpoint overshot by > 0.3 ml.');
          return;
        }
        if (s.activeModule === 'ALKALINITY' && currentVol > s.endpointB + 0.3) {
          get().failExperiment('Overflow: Total alkalinity endpoint overshot by > 0.3 ml.');
          return;
        }
        set({ flaskTitrantVolume: currentVol });

        // Instant broadcast of continuous titration flow to BroadcastChannel (every ~30ms for 30+ fps smoothness)
        const now = Date.now();
        if (typeof window !== 'undefined') {
          (window as any).__LAST_TITRANT_VOL = currentVol;
        }
        if (!(window as any).__last_telem_sent || now - (window as any).__last_telem_sent > 30) {
          (window as any).__last_telem_sent = now;
          const myId = s.stopcockOperatorId || (typeof window !== 'undefined' ? (window as any).__HYD_CLIENT_ID : '');
          const ep = s.activeModule === 'ALKALINITY' ? s.endpointB : s.endpoint;

          const telemPacket = {
            type: 'TELEMETRY' as const,
            roomId: (typeof window !== 'undefined' && (window as any).__CURRENT_ROOM_ID) || 'LAB-402',
            studentId: 'student_guru_2026',
            clientId: myId,
            module: s.activeModule || 'HARDNESS',
            volumeDispensed: currentVol,
            isStopcockOpen: true,
            stopcockOperatorId: myId,
            flaskColor: '#991b1b',
            isEndpointReached: currentVol >= ep,
            timestamp: now
          };

          // Fast direct BroadcastChannel post without dynamic import overhead
          try {
            if ((window as any).__nexconn_channel) {
              (window as any).__nexconn_channel.postMessage(telemPacket);
            }
          } catch {}

          import('../services/nexconnManager').then(({ default: NexconnManager }) => {
            const mgr = NexconnManager.getInstance();
            if (!(window as any).__nexconn_channel) {
              (window as any).__nexconn_channel = mgr.getBroadcastChannel();
            }
            mgr.broadcastTelemetry({
              roomId: mgr.getActiveRoom(),
              studentId: mgr.getUserId() || 'student_guru_2026',
              module: s.activeModule || 'HARDNESS',
              volumeDispensed: currentVol,
              isStopcockOpen: true,
              stopcockOperatorId: s.stopcockOperatorId,
              flaskColor: '#991b1b',
              isEndpointReached: currentVol >= ep,
            });
          });
        }
      }

      let colorReport;
      if (s.activeModule === 'ALKALINITY') {
        colorReport = calculateAlkalinityColor(currentVol, s.endpointA, s.endpointB, s.flaskHasSample, s.flaskHasPhenol, s.flaskHasMethyl, s.isSwirling, s.lastSwirlVolume);
      } else {
        colorReport = calculateHardnessColor(currentVol, s.endpoint, s.flaskHasSample, s.flaskHasIndicator, s.isSwirling, s.lastSwirlVolume);
      }
      set({ solutionColor: colorReport, warningMessage: colorReport.message || null });
    }

    // AI Proactive Logic
    const state = get();
    if (state.activeMode === 'PRACTICE' && !state.isExperimentFailed) {
      let currentVol = 0;
      let ep = 999;
      
      if (state.activeModule === 'HARDNESS') {
        currentVol = state.flaskTitrantVolume;
        ep = state.endpoint;
      } else if (state.activeModule === 'ALKALINITY') {
        currentVol = state.flaskTitrantVolume;
        ep = currentVol < state.endpointA + 0.5 ? state.endpointA : state.endpointB;
      } else if (state.activeModule === 'COD') {
        currentVol = state.codActiveStation === 'SAMPLE' ? state.sampleTitrantVolume : state.blankTitrantVolume;
        ep = state.codActiveStation === 'SAMPLE' ? state.endpointCODSample : state.endpointCODBlank;
      }

      if (currentVol > 0) {
        // 1. Low Titrant Warning
        if (!state.aiWarnedLowTitrant && currentVol >= 22.0) {
          get().triggerAIIntervention("is running out of titrant in the burette. Tell them to be careful as they are nearing 25 mL.", 'burette');
          set({ aiWarnedLowTitrant: true });
        }

        // 2. Near Endpoint (within 2.5 mL) - Early Warning
        if (!state.aiWarnedNearEndpoint && (ep - currentVol) <= 2.5 && (ep - currentVol) > 1.0) {
          get().triggerAIIntervention("is approaching the endpoint (within 2.5 mL). Warn them to slow down the flow.", 'burette');
          set({ aiWarnedNearEndpoint: true });
        }

        // 3. Dropwise Warning (within 0.8 mL) - Very close!
        if (!state.aiWarnedDropwise && (ep - currentVol) <= 0.8 && (ep - currentVol) > 0.2) {
          get().triggerAIIntervention("is extremely close to the endpoint! Tell them to switch to DROPWISE mode immediately to avoid overshooting.", 'flask');
          set({ aiWarnedDropwise: true });
        }

        // 4. Endpoint Hit (within 0.2 mL) - Stop now!
        if (!state.aiWarnedEndpointHit && Math.abs(ep - currentVol) <= 0.2) {
          get().triggerAIIntervention("just hit the exact endpoint! Yell at them to close the stopcock immediately!", 'flask');
          set({ aiWarnedEndpointHit: true });
        }

        // 5. Swirl Warning
        if (state.isStopcockOpen && !state.isSwirling && !state.aiWarnedSwirl && currentVol > 1.0) {
          get().triggerAIIntervention("is continuously adding titrant but hasn't swirled the flask recently. Tell them to swirl constantly while titrating.", 'flask');
          set({ aiWarnedSwirl: true });
        }
      }
    }
  },

  updateLogbook: (field, value) => {
    set((state) => {
      const updates: Partial<SimulationState> = { [field]: value };
      
      const chk = { ...state.checklist };
      if (field === 'userFinalReading') chk.recordReading1 = value.trim() !== '';
      if (field === 'userFinalReadingA') chk.recordReading1 = value.trim() !== '';
      if (field === 'userFinalReadingB') chk.recordReading2 = value.trim() !== '';
      if (field === 'userHardnessInput' || field === 'userTAInput') chk.submitCalculation = value.trim() !== '';

      if (field === 'userCODEndpointSample') chk.codSampleRecordV2 = value.trim() !== '';
      if (field === 'userCODEndpointBlank') chk.codBlankRecordV1 = value.trim() !== '';
      if (field === 'userCODResult') chk.submitCalculation = value.trim() !== '';
      
      if (field === 'userPHResult') chk.phRecordResult = value.trim() !== '';

      // Broadcast logbook input to partner immediately via both Nexconn and local channel
      import('../services/nexconnManager').then(({ default: NexconnManager }) => {
        NexconnManager.getInstance().broadcastFullSnapshot({
          [field]: value,
          checklist: chk,
        });
      });

      return { ...updates, checklist: chk };
    });
  },

  submitExperiment: async () => {
    const state = get();
    
    const timeElapsedSeconds = state.assessmentStartTime 
      ? Math.floor((Date.now() - state.assessmentStartTime) / 1000) 
      : 0;

    let report: ScoreReport;
    
    if (state.activeModule === 'ALKALINITY') {
      report = evaluateAlkalinityTitration({
        endpointA: state.endpointA,
        endpointB: state.endpointB,
        finalVolumeA: parseFloat(state.userFinalReadingA) || null,
        finalVolumeB: state.flaskTitrantVolume,
        hasSampleAdded: state.flaskHasSample,
        selectedTitrant: state.isBuretteFilled ? 'HCL' : null,
        selectedIndicatorPhenol: state.flaskHasPhenol,
        selectedIndicatorMethyl: state.flaskHasMethyl,
        isBuretteFilled: state.isBuretteFilled,
        usedDropwiseNearEndpoint: state.usedDropwiseNearEndpoint,
        swirledNearEndpoint: state.swirledNearEndpoint,
        userInitialReading: state.userInitialReading,
        userFinalReadingA: state.userFinalReadingA,
        userFinalReadingB: state.userFinalReadingB,
        userPAInput: state.userPAInput,
        userTAInput: state.userTAInput,
        userOHInput: state.userOHInput,
        userCO3Input: state.userCO3Input,
        userHCO3Input: state.userHCO3Input,
        timeElapsedSeconds
      });
    } else if (state.activeModule === 'COD') {
      report = evaluateCODTitration({
        endpointSample: state.endpointCODSample,
        endpointBlank: state.endpointCODBlank,
        finalVolumeSample: parseFloat(state.userCODEndpointSample) || null,
        finalVolumeBlank: parseFloat(state.userCODEndpointBlank) || null,
        
        sampleHasWater: state.sampleHasWater,
        sampleHasK2Cr2O7: state.sampleHasK2Cr2O7,
        sampleHasH2SO4: state.sampleHasH2SO4,
        sampleHasFerroin: state.sampleHasFerroin,
        sampleRefluxCompleted: state.sampleRefluxCompleted,
        sampleBuretteFilled: state.sampleBuretteFilled,

        blankHasWater: state.blankHasWater,
        blankHasK2Cr2O7: state.blankHasK2Cr2O7,
        blankHasH2SO4: state.blankHasH2SO4,
        blankHasFerroin: state.blankHasFerroin,
        blankRefluxCompleted: state.blankRefluxCompleted,
        blankBuretteFilled: state.blankBuretteFilled,

        usedDropwiseNearEndpoint: state.usedDropwiseNearEndpoint,
        swirledNearEndpoint: state.swirledNearEndpoint,
        
        userInitialSample: state.userCODInitialSample,
        userFinalSample: state.userCODEndpointSample,
        userInitialBlank: state.userCODInitialBlank,
        userFinalBlank: state.userCODEndpointBlank,
        userCODResult: state.userCODResult,
        timeElapsedSeconds
      });
    } else if (state.activeModule === 'PH') {
      report = evaluatePHDetermination({
        phCalibrate7: (state.checklist as any).phCalibrate7 ?? false,
        phCalibrate4: (state.checklist as any).phCalibrate4 ?? false,
        phCleanElectrode1: (state.checklist as any).phCleanElectrode1 ?? false,
        phCleanElectrode2: (state.checklist as any).phCleanElectrode2 ?? false,
        phCleanElectrode3: (state.checklist as any).phCleanElectrode3 ?? false,
        phMeasureSample: (state.checklist as any).phMeasureSample ?? false,
        userPHResult: state.userPHResult,
        phTrueSampleValue: state.phTrueSampleValue,
        timeElapsedSeconds
      });
    } else {
      report = evaluateTitration({
        endpoint: state.endpoint,
        finalVolume: state.flaskTitrantVolume,
        hasSampleAdded: state.flaskHasSample,
        selectedTitrant: state.isBuretteFilled ? 'EDTA' : null,
        selectedIndicator: state.flaskHasIndicator ? 'EBT' : null,
        isBuretteFilled: state.isBuretteFilled,
        usedDropwiseNearEndpoint: state.usedDropwiseNearEndpoint,
        swirledNearEndpoint: state.swirledNearEndpoint,
        userInitialReading: state.userInitialReading,
        userFinalReading: state.userFinalReading,
        userHardnessInput: state.userHardnessInput,
        timeElapsedSeconds
      });
    }

    set({ isExperimentSubmitted: true, evaluationReport: report });
    get().addTimelineEvent(`Experiment evaluated. Score: ${report.score}/100.`);

    // Submit session to backend (both practice and assessment)
    try {
      const axios = (await import('axios')).default;
      await axios.post('/api/v1/student/session', {
        module: state.activeModule,
        mode: state.activeMode,
        score: report.score,
        timeSpentSeconds: timeElapsedSeconds,
        status: report.score >= 50 ? 'PASSED' : 'FAILED',
        mistakes: report.feedback,
        improvementAreas: report.tips
      });
      console.log(`${state.activeMode} session submitted successfully`);
    } catch (error) {
      console.error(`Failed to submit ${state.activeMode} session`, error);
    }
  },

  failExperiment: async (reason: string) => {
    const state = get();
    const timeElapsedSeconds = state.assessmentStartTime 
      ? Math.floor((Date.now() - state.assessmentStartTime) / 1000) 
      : 0;

    set({ 
      isExperimentFailed: true, 
      failureReason: reason, 
      isStopcockOpen: false 
    });

    try {
      const axios = (await import('axios')).default;
      await axios.post('/api/v1/student/session', {
        module: state.activeModule,
        mode: state.activeMode,
        score: 0,
        timeSpentSeconds: timeElapsedSeconds,
        status: 'FAILED',
        mistakes: [reason],
        improvementAreas: ['You exceeded the critical volume threshold (overflow). Proceed with caution next time.']
      });
      console.log(`${state.activeMode} failure session submitted successfully`);
    } catch (error) {
      console.error(`Failed to submit ${state.activeMode} failure session`, error);
    }
  },

  addChatMessage: (role, content) => set((state) => ({
    chatHistory: [...state.chatHistory, { role, content }]
  })),

  setAiTyping: (isTyping) => set({ isAiTyping: isTyping }),

  setEvaluationReport: (report) => set({ evaluationReport: report }),

  setCompanionOpen: (isOpen) => set({ isCompanionOpen: isOpen }),

  setPopupMessage: (msg) => set({ popupMessage: msg }),
  setCameraFocusTarget: (target) => set({ cameraFocusTarget: target }),


  showCompanionMessage: (msg: string, position: 'center' | 'burette' | 'flask' | 'default' = 'default') => {
    set((state) => ({
      companionPosition: position,
      popupMessage: msg,
      chatHistory: [...state.chatHistory, { role: 'assistant', content: msg }]
    }));
    setTimeout(() => {
      set((state) => {
        if (state.popupMessage === msg) return { popupMessage: null, companionPosition: 'default' };
        return state;
      });
    }, 6000);
  },
  triggerAIIntervention: async (mistakeContext, position = 'center') => {
    const s = get();
    if (s.activeMode !== 'PRACTICE') return; // Only trigger in practice mode

    // 1. Move the avatar and show typing state
    set({
      companionPosition: position,
      isAiTyping: true,
      popupMessage: 'Dr. Hydro is thinking...'
    });

    // 2. Fetch the proactive response
    const { generateProactiveIntervention } = await import('../services/aiService');
    const labStateSummary = `Module: ${s.activeModule}
Burette Filled: ${s.isBuretteFilled}
Flask Titrant: ${s.flaskTitrantVolume.toFixed(2)}mL
Stopcock Open: ${s.isStopcockOpen}`;

    try {
      const response = await generateProactiveIntervention(mistakeContext, labStateSummary);
      set((state) => ({
        chatHistory: [...state.chatHistory, { role: 'assistant', content: response }],
        popupMessage: response,
        isAiTyping: false
      }));

      // Auto-clear popup and fly back after 3 seconds
      setTimeout(() => {
        set((state) => {
          if (state.popupMessage === response) {
            return { popupMessage: null, companionPosition: 'default' };
          }
          return state;
        });
      }, 3000);

    } catch (e) {
      set({ isAiTyping: false, popupMessage: 'Having network trouble...' });
    }
  }
}));

// Global Flag to avoid infinite sync echo loops
let isApplyingRemoteSync = false;

export const applyRemoteSnapshot = (snapshot: Partial<SimulationState>) => {
  isApplyingRemoteSync = true;
  useSimulationStore.setState(snapshot);
  isApplyingRemoteSync = false;
};

// Automatic Store Change Listener for 100% Real-Time Mutual Collaboration
// Note: High-frequency fluid titration volumes are streamed via direct 30-60fps TELEMETRY,
// not via broadcastFullSnapshot, to eliminate network throttle and lag.
const SYNCABLE_KEYS: (keyof SimulationState)[] = [
  'activeModule', 'activeMode', 'endpoint', 'endpointA', 'endpointB', 'endpointCODBlank', 'endpointCODSample',
  'codActiveStation',
  'checklist', 'selectedEquipment', 'activePipetteLiquid',
  'isBuretteFilled', 'flaskHasSample', 'flaskSampleVolume',
  'flaskHasIndicator', 'flaskIndicatorType', 'flaskHasPhenol', 'flaskHasMethyl',
  'isStopcockOpen', 'stopcockOperatorId', 'flowMode', 'isSwirling', 'solutionColor',
  'userInitialReading', 'userFinalReading', 'userHardnessInput',
  'userFinalReadingA', 'userFinalReadingB', 'userPAInput', 'userTAInput', 'userOHInput', 'userCO3Input', 'userHCO3Input',
  'userCODInitialSample', 'userCODEndpointSample', 'userCODInitialBlank', 'userCODEndpointBlank', 'userCODResult',
  'userPHResult',
  'sampleHasWater', 'sampleHasK2Cr2O7', 'sampleHasH2SO4', 'sampleHasFerroin',
  'sampleIsRefluxing', 'sampleRefluxCompleted', 'sampleBuretteFilled',
  'blankHasWater', 'blankHasK2Cr2O7', 'blankHasH2SO4', 'blankHasFerroin',
  'blankIsRefluxing', 'blankRefluxCompleted', 'blankBuretteFilled',
  'phMeterPowerOn', 'phMeterCalibrated', 'phMeterCurrentReading', 'phElectrodeSubmergedIn', 'phElectrodeClean'
];

useSimulationStore.subscribe((state, prevState) => {
  if (isApplyingRemoteSync) return;

  // Check if any syncable property changed
  let hasChanges = false;
  const snapshot: any = {};

  for (const key of SYNCABLE_KEYS) {
    if (state[key] !== prevState[key]) {
      hasChanges = true;
      snapshot[key] = state[key];
    }
  }

  if (hasChanges) {
    // Also include the latest endpoints and current titrant volumes so snapshots never reset burette to 0!
    snapshot.endpoint = state.endpoint;
    snapshot.endpointA = state.endpointA;
    snapshot.endpointB = state.endpointB;
    snapshot.endpointCODBlank = state.endpointCODBlank;
    snapshot.endpointCODSample = state.endpointCODSample;

    snapshot.flaskTitrantVolume = state.flaskTitrantVolume;
    snapshot.sampleTitrantVolume = state.sampleTitrantVolume;
    snapshot.blankTitrantVolume = state.blankTitrantVolume;

    import('../services/nexconnManager').then(({ default: NexconnManager }) => {
      NexconnManager.getInstance().broadcastFullSnapshot(snapshot);
    });
  }
});

