import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronLeft, ChevronRight, ClipboardList, Send, FolderClock, ShieldAlert,
  Languages, WifiOff, Lock, Camera, Video, PenLine, Plane, Mic, X,
  AlertTriangle, Clock, Target, Eye, CheckCircle2, AlertCircle, RadioTower,
  CircleDot, Pin, ArrowUpRight, User, MapPin, Truck, MessageSquare, Banknote,
  Shield, Users, Flag, Scale, Square, Trash2, Crosshair, Battery, Satellite,
  Radio, Compass, Home, History, PlusCircle, Activity, Power, Volume2,
} from "lucide-react";

// =============================================================================
// ARS POC — INTEGRATED · SOURCE-SIDE
// All source-side screens wired together with real navigation + shared state.
// Built in passes: Turn 1 = foundation; Turns 2-3 = screen modules via str_replace.
// =============================================================================

const AMBER = "#C9A961";
const AMBER_DIM = "#8A7340";
const RED = "#DC2626";
const RED_LIGHT = "#FCA5A5";
const GREEN = "#10B981";
const ORANGE = "#F59E0B";
const BG = "#0A0B0D";
const PANEL = "#111316";
const HAIRLINE = "rgba(201, 169, 97, 0.18)";
const HAIRLINE_STRONG = "rgba(201, 169, 97, 0.45)";

function relTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// =============================================================================
// SYNTHETIC DATA
// =============================================================================
const STANDING = [
  { id: "SR-S7421-002", title: "New faces in known safehouses", desc: "Any newly-observed individuals at addresses already in your reporting set. Photo-document if safe.", pirs: ["PIR-1","PIR-2"], activeSince: "Jan 2026" },
  { id: "SR-S7421-005", title: "Bulk cash movement (>$10K equiv)", desc: "Any sighting of cash courier activity, large-volume cash transactions, or unexplained luxury asset purchases in the AO.", pirs: ["PIR-3","PIR-4"], activeSince: "Feb 2026" },
  { id: "SR-S7421-007", title: "Corruption indicators at POEs in AO", desc: "Wave-throughs, lane patterns, officials by description. Nothing actionable required — just report what you see.", pirs: ["PIR-5"], activeSince: "Mar 2026" },
];

// Seed data — WALKER-3 is the demo handler for all seeded sources at POC scale.
// Not session-bound; messages tab is intentionally static for v0.2.
const MESSAGES = [
  { id: "MSG-0103", from: "WALKER-3", ts: "47m ago", body: "Confirmed receipt of TSK-0089 photos. Excellent work. Stay clear of the route tonight.", unread: true },
  { id: "MSG-0102", from: "WALKER-3", ts: "1d ago",  body: "TSK-0083 cited in INTSUM. Don't return to that observation point this week.", unread: false },
  { id: "MSG-0101", from: "WALKER-3", ts: "3d ago",  body: "Quarterly check-in window opens Friday. Standard protocol.", unread: false },
];

const CATEGORIES = [
  { key: "person", icon: User, iaRef: "IA §5.1", title: { en: "PERSON", es: "PERSONA" }, blurb: { en: "Individual — target, new face, associate", es: "Individuo — objetivo, nuevo rostro" },
    subs: [
      { key: "new-person", en: "New person seen", es: "Nueva persona vista", hint: { en: "Not previously reported", es: "No reportada anteriormente" } },
      { key: "update", en: "Update on known person", es: "Actualización", hint: { en: "New info on someone already in system", es: "Nueva información" } },
      { key: "pattern-of-life", en: "Pattern of life", es: "Patrón de vida", hint: { en: "Routine, schedule, daily movements", es: "Rutina, horario" } },
      { key: "associates", en: "Associates / network", es: "Asociados / red", hint: { en: "Who they're seen with", es: "Con quién se le ve" } },
      { key: "vehicle-property", en: "Vehicle / property linked", es: "Vehículo / propiedad", hint: { en: "Asset attribution", es: "Atribución de bienes" } },
      { key: "threat", en: "Threat / change in posture", es: "Amenaza / cambio", hint: { en: "More dangerous, gone into hiding", es: "Más peligroso, escondido" } },
    ] },
  { key: "place", icon: MapPin, iaRef: "IA §5.2", title: { en: "PLACE", es: "LUGAR" }, blurb: { en: "Fixed site — building, lab, route node", es: "Sitio fijo — edificio, laboratorio" },
    subs: [
      { key: "new-location", en: "New location of interest", es: "Nueva ubicación", hint: { en: "Newly identified site", es: "Sitio recién identificado" } },
      { key: "update-location", en: "Update on known location", es: "Actualización ubicación", hint: { en: "Change in activity or security", es: "Cambio en actividad" } },
      { key: "lab", en: "Drug lab / production site", es: "Laboratorio", hint: { en: "Suspected or confirmed", es: "Sospechado o confirmado" } },
      { key: "stash", en: "Stash / storage site", es: "Escondite", hint: { en: "Drugs, weapons, cash, vehicles", es: "Drogas, armas, dinero" } },
      { key: "safe-house", en: "Safe house / residence", es: "Casa de seguridad", hint: { en: "Used by a target", es: "Usada por un objetivo" } },
      { key: "front-business", en: "Business front", es: "Fachada comercial", hint: { en: "Restaurant, ranch, transport co.", es: "Restaurante, rancho" } },
      { key: "meeting-site", en: "Meeting site", es: "Sitio de reunión", hint: { en: "Where targets gather", es: "Donde se reúnen los objetivos" } },
      { key: "checkpoint", en: "Checkpoint / border crossing", es: "Retén / cruce", hint: { en: "Including corruption posture", es: "Incluyendo postura de corrupción" } },
      { key: "airstrip", en: "Airstrip / port / dock", es: "Pista / puerto / muelle", hint: { en: "Air or maritime nodes", es: "Nodos aéreos o marítimos" } },
    ] },
  { key: "event", icon: AlertTriangle, iaRef: "IA §5.3", title: { en: "EVENT / INCIDENT", es: "EVENTO" }, blurb: { en: "Discrete observable event", es: "Evento puntual observable" },
    subs: [
      { key: "drug-deal", en: "Drug deal / handoff", es: "Transacción de droga", hint: { en: "Witnessed transaction", es: "Transacción presenciada" } },
      { key: "violence", en: "Violence / kinetic event", es: "Violencia / cinético", hint: { en: "Shooting, assault, kidnapping", es: "Tiroteo, asalto, secuestro" } },
      { key: "police-action", en: "Arrest or police action", es: "Arresto o acción policial", hint: { en: "Including suspected staged actions", es: "Incluye acciones montadas" } },
      { key: "convoy", en: "Vehicle / convoy activity", es: "Actividad de convoy", hint: { en: "Movement that doesn't yet warrant Movement report", es: "Movimiento" } },
      { key: "aircraft", en: "Aircraft activity", es: "Actividad aérea", hint: { en: "Unusual flights, landings", es: "Vuelos inusuales" } },
      { key: "maritime", en: "Maritime activity", es: "Actividad marítima", hint: { en: "Boats, submersibles, dock activity", es: "Embarcaciones" } },
      { key: "suspicious", en: "Suspicious activity (other)", es: "Actividad sospechosa", hint: { en: "Catch-all for \"something's wrong\"", es: "Cuando algo no encaja" } },
      { key: "threat-source", en: "Threat against source", es: "Amenaza al informante", hint: { en: "Force protection — auto-flags handler", es: "Protección — alerta", danger: true } },
    ] },
  { key: "movement", icon: Truck, iaRef: "IA §5.4", title: { en: "MOVEMENT / SHIPMENT", es: "MOVIMIENTO" }, blurb: { en: "Drugs, weapons, money, or people in transit", es: "Drogas, armas, dinero, personas en tránsito" },
    subs: [
      { key: "drug-shipment", en: "Drug shipment observed", es: "Envío de droga observado", hint: { en: "Loading, transport, unloading", es: "Carga, transporte, descarga" } },
      { key: "weapons", en: "Weapons shipment", es: "Envío de armas", hint: { en: "Movement of arms", es: "Movimiento de armamento" } },
      { key: "cash", en: "Cash movement", es: "Movimiento de efectivo", hint: { en: "Bulk currency, money courier", es: "Efectivo, mensajeros" } },
      { key: "trafficking", en: "Person trafficking / smuggling", es: "Tráfico de personas", hint: { en: "Migrants, captives, recruits", es: "Migrantes, cautivos" } },
      { key: "precursor", en: "Precursor chemical movement", es: "Químicos precursores", hint: { en: "Inputs to lab production", es: "Insumos para producción" } },
      { key: "voi", en: "Vehicle of interest in transit", es: "Vehículo de interés", hint: { en: "Tracking known TCO vehicle", es: "Vehículo conocido del TCO" } },
    ] },
  { key: "conversation", icon: MessageSquare, iaRef: "IA §5.5", title: { en: "CONVERSATION", es: "CONVERSACIÓN" }, blurb: { en: "Something said — overheard or stated", es: "Algo dicho — escuchado o declarado" },
    subs: [
      { key: "overheard", en: "Overheard conversation", es: "Conversación escuchada", hint: { en: "Nearby but not a participant", es: "Cerca pero sin participar" } },
      { key: "direct", en: "Direct conversation with target", es: "Conversación directa", hint: { en: "Informant talked to the subject", es: "El informante habló con el sujeto" } },
      { key: "recorded", en: "Recorded conversation", es: "Conversación grabada", hint: { en: "Audio capture (uploaded)", es: "Captura de audio" } },
      { key: "threat-verbal", en: "Threat or warning made", es: "Amenaza verbal", hint: { en: "Specific verbal threat", es: "Amenaza verbal específica" } },
      { key: "plan", en: "Plan / intent stated", es: "Plan / intención", hint: { en: "Subject described planned action", es: "Sujeto describió acción planeada" } },
      { key: "boast", en: "Boast / confession", es: "Alarde / confesión", hint: { en: "Subject described past action", es: "Sujeto describió acción pasada" } },
    ] },
  { key: "money", icon: Banknote, iaRef: "IA §5.6", title: { en: "MONEY / BUSINESS", es: "DINERO" }, blurb: { en: "Financial activity, businesses, assets", es: "Actividad financiera, negocios, bienes" },
    subs: [
      { key: "front", en: "Front business identified", es: "Fachada identificada", hint: { en: "Suspected of laundering", es: "Sospechosa de lavado" } },
      { key: "cash-tx", en: "Cash transaction observed", es: "Transacción en efectivo", hint: { en: "Specific transaction", es: "Transacción específica" } },
      { key: "bank", en: "Bank / money service used", es: "Banco / servicio", hint: { en: "Specific institution", es: "Institución específica" } },
      { key: "real-estate", en: "Real estate / property", es: "Bienes raíces", hint: { en: "Asset acquisition", es: "Adquisición de bienes" } },
      { key: "luxury", en: "Vehicle / luxury asset", es: "Vehículo de lujo", hint: { en: "High-value goods", es: "Bienes de alto valor" } },
      { key: "crypto", en: "Cryptocurrency / digital wallet", es: "Cripto / billetera", hint: { en: "Wallet, exchange, tx pattern", es: "Dirección, casa de cambio" } },
      { key: "bribery", en: "Bribery / payment to official", es: "Soborno", hint: { en: "Cross-flagged to Official/Insider", es: "Marcado a Funcionario" } },
    ] },
  { key: "official", icon: Shield, iaRef: "IA §5.7 · GATED", title: { en: "OFFICIAL / INSIDER", es: "FUNCIONARIO" }, blurb: { en: "Corrupted official or institutional insider", es: "Funcionario corrupto o insider" }, gated: true,
    subs: [
      { key: "le", en: "Corrupted law enforcement", es: "Policía corrompida", hint: { en: "Local, state, federal — on TCO payroll", es: "Local, estatal, federal" } },
      { key: "military", en: "Corrupted military", es: "Militar corrompido", hint: { en: "Soldiers or officers compromised", es: "Soldados u oficiales" } },
      { key: "customs", en: "Corrupted customs / border", es: "Aduana corrompida", hint: { en: "Officials enabling cross-border movement", es: "Funcionarios que permiten cruces" } },
      { key: "judicial", en: "Corrupted judicial / prosecutor", es: "Juez / fiscal corrompido", hint: { en: "Judges, prosecutors", es: "Jueces, fiscales" } },
      { key: "political", en: "Corrupted political / elected", es: "Político corrompido", hint: { en: "Mayors, legislators, governors", es: "Alcaldes, legisladores" } },
      { key: "private", en: "Insider at private institution", es: "Insider privado", hint: { en: "Bank, telecom, hospital", es: "Banco, telecom, hospital" } },
    ] },
  { key: "community", icon: Users, iaRef: "IA §5.8", title: { en: "COMMUNITY / MOOD", es: "COMUNIDAD" }, blurb: { en: "Sentiment, propaganda, recruitment", es: "Sentimiento, propaganda" },
    subs: [
      { key: "sentiment", en: "Community sentiment shift", es: "Cambio en sentimiento", hint: { en: "Population becoming more / less cooperative", es: "Población más / menos cooperativa" } },
      { key: "propaganda", en: "TCO propaganda activity", es: "Propaganda del TCO", hint: { en: "Banners, social media, narcocorridos", es: "Mantas, redes" } },
      { key: "recruit", en: "TCO recruitment activity", es: "Reclutamiento", hint: { en: "Targeting youth, ex-military, displaced", es: "A jóvenes, ex-militares" } },
      { key: "unrest", en: "Civil unrest / protest", es: "Disturbios", hint: { en: "May be TCO-driven or anti-TCO", es: "Puede ser del TCO o anti-TCO" } },
      { key: "displacement", en: "Displacement / migration", es: "Desplazamiento", hint: { en: "Population movement out of an area", es: "Movimiento poblacional" } },
      { key: "social", en: "TCO social services", es: "Servicios del TCO", hint: { en: "Cartel providing food, security, services", es: "Cártel proveyendo servicios" } },
    ] },
];

const CATCHALL = {
  key: "other", icon: PenLine, iaRef: "IA §5.9 · CATCH-ALL",
  title: { en: "OTHER / FREE NOTE", es: "OTRO" }, blurb: { en: "Doesn't fit a category? Don't lose the report.", es: "¿No encaja? No pierda el reporte." },
  subs: [
    { key: "general", en: "General observation", es: "Observación general", hint: { en: "Doesn't fit the eight buckets", es: "No encaja" } },
    { key: "question", en: "Question for handler", es: "Pregunta al contacto", hint: { en: "Need clarification", es: "Necesita aclaración" } },
    { key: "status", en: "Source-status update", es: "Estado del informante", hint: { en: "e.g., \"I'm being watched\"", es: "p.ej., \"Me están vigilando\"", danger: true } },
    { key: "logistics", en: "Logistical note", es: "Nota logística", hint: { en: "e.g., \"need a phone replacement\"", es: "p.ej., \"necesito reemplazo\"" } },
  ],
};

// =============================================================================
// WIZARD CHIP OPTION LISTS — for PERSON > New person seen
// =============================================================================
const SEX_OPTIONS = [
  { key: "m", en: "Male", es: "Masculino" },
  { key: "f", en: "Female", es: "Femenino" },
  { key: "u", en: "Unsure", es: "No sé" },
];
const AGE_OPTIONS = [
  { key: "teens", en: "Teens", es: "Adolescente" },
  { key: "20s", en: "20s", es: "20s" },
  { key: "30s", en: "30s", es: "30s" },
  { key: "40s", en: "40s", es: "40s" },
  { key: "50s", en: "50s", es: "50s" },
  { key: "60p", en: "60+", es: "60+" },
  { key: "u", en: "Unsure", es: "No sé" },
];
const BUILD_OPTIONS = [
  { key: "slim", en: "Slim", es: "Delgado" },
  { key: "avg", en: "Average", es: "Medio" },
  { key: "heavy", en: "Heavy", es: "Pesado" },
  { key: "u", en: "Unsure", es: "No sé" },
];
const TIME_OPTIONS = [
  { key: "now", en: "Just now", es: "Ahora mismo" },
  { key: "hour", en: "Within hour", es: "Última hora" },
  { key: "today", en: "Earlier today", es: "Hoy más temprano" },
  { key: "yest", en: "Yesterday", es: "Ayer" },
  { key: "week", en: "Earlier this week", es: "Esta semana" },
  { key: "custom", en: "Other...", es: "Otro..." },
];
const BASIS_OPTIONS = [
  { key: "direct",  en: "I saw them myself", es: "Los vi yo mismo", icon: Eye },
  { key: "hearsay", en: "Someone told me", es: "Alguien me contó", icon: Volume2 },
  { key: "doc",     en: "I read it / written", es: "Lo leí / escrito", icon: PenLine },
];
const CONFIDENCE_OPTIONS = [
  { key: "low",  en: "LOW", es: "BAJA",  desc: { en: "Not very sure", es: "No muy seguro" }, color: ORANGE },
  { key: "med",  en: "MED", es: "MEDIA", desc: { en: "Pretty sure", es: "Bastante seguro" }, color: AMBER },
  { key: "high", en: "HIGH", es: "ALTA", desc: { en: "Very sure", es: "Muy seguro" },        color: GREEN },
];

// =============================================================================
// COPY
// =============================================================================
const COPY = {
  en: {
    classification: "DEMO // SIMULATED HUMINT // NOT REAL INTELLIGENCE",
    demoLine: "DEMO // NO REAL INTEL",
    backLabel: "BACK", sourceLabel: "SRC",
    appVer: "HARS POC · INTEGRATED · v1.0", queue: "queued", syncOffline: "OFFLINE",
    homeBreadcrumb: "HARS", modeBreadcrumb: "HOME · COLLECT",
    instructionsBreadcrumb: "HOME · INSTRUCTIONS", taskBreadcrumb: "INSTRUCTIONS · TASK",
    qcBreadcrumb: "HOME · COLLECT · QUICK", structuredBreadcrumb: "HOME · COLLECT · STRUCTURED",
    droneBreadcrumb: "HOME · COLLECT · DRONE", preMissionBreadcrumb: "DRONE · PLAN",
    flightBreadcrumb: "DRONE · LIVE", reviewBreadcrumb: "DRONE · REVIEW",
    draftsBreadcrumb: "HOME · DRAFTS", secureBreadcrumb: "HOME · SECURE",

    arsTitle: "HARS", arsSub: "HUMINT Advanced Reporting System", homeGreeting: "STANDING BY",
    homeInstructions: "MY INSTRUCTIONS", homeInstructionsSub: "Tasking from your handler", homeInstructionsBadge: "3 NEW",
    homeCollect: "COLLECT & REPORT", homeCollectSub: "Capture intel — photo, audio, or guided",
    homeDrafts: "MY DRAFTS", homeDraftsSub: "Resume or sync queued reports",
    homeSecure: "SECURE / DURESS", homeSecureSub: "Emergency tools",

    modeTitle: "HOW DO YOU WANT TO REPORT?", modeSubtitle: "Three capture modes. Pick what fits the moment.",
    modeQuick: "QUICK CAPTURE", modeQuickSub: "Just record now — tag it later", modeQuickHint: "Photo · Video · Audio · Geo-pin",
    modeStructured: "STRUCTURED REPORT", modeStructuredSub: "Guided report by category", modeStructuredHint: "8 categories · wizard",
    modeDrone: "DRONE MISSION", modeDroneSub: "Launch and capture from drone", modeDroneHint: "Pre-mission · Live · Post-mission",

    miTitle: "MY INSTRUCTIONS", miSub: "Tasking from your handler",
    tabActive: "ACTIVE", tabStanding: "STANDING", tabCompleted: "DONE", tabMessages: "MSG",
    pTimeSensitive: "TIME-SENSITIVE", pPriority: "PRIORITY", pRoutine: "ROUTINE",
    newPill: "NEW", dueLabel: "DUE", overdueLabel: "OVERDUE",
    days: "d", hours: "h", minutes: "m", activeEmpty: "No active tasks. Stand down.",
    standingPersistentLabel: "ALWAYS-ON · NO DEADLINE", standingActiveSince: "ACTIVE SINCE",
    statusValidated: "VALIDATED", statusPending: "PENDING VALIDATION", statusRejected: "REJECTED",
    completedSubmittedAt: "SUBMITTED", msgUnread: "UNREAD", msgReply: "REPLY",

    tdHeaderIssued: "ISSUED", tdHeaderHandler: "HANDLER", tdHeaderLegal: "LEGAL REVIEW",
    tdTarget: "TARGET", tdGuidance: "GUIDANCE", tdConstraints: "CONSTRAINTS",
    tdLinkedCategory: "LINKED CATEGORY", tdPirAlignment: "PIR ALIGNMENT",
    startReport: "START REPORT ON THIS TASK", startReportSub: "Pre-fills the right Collect & Report category",
    reportConcern: "Report tasking concern", acknowledgeDefer: "Acknowledge & defer",
    concernTitle: "REPORT TASKING CONCERN",
    concernBody: "Use this if a task feels operationally wrong, dangerous, or outside what you would normally do. Your handler and Unit legal will review. You will not be penalized.",
    concernExamples: "Examples: asks you to break the law you would not break · puts you in greater danger than usual · feels like it's testing you",
    concernPlaceholder: "Briefly describe your concern...", concernSend: "Send to handler + legal", concernCancel: "Cancel",

    qcTitle: "QUICK CAPTURE", qcSub: "Just record. Tag it later.",
    photo: "PHOTO", photoHint: "Single or burst", video: "VIDEO", videoHint: "Short — sync-friendly",
    audio: "AUDIO", audioHint: "Voice or environmental", geoPin: "GEO-PIN", geoPinHint: "Drop a pin · optional note",
    qcProtection: "EXIF stripped · location offset on · encrypted at rest",
    recording: "RECORDING", listening: "LISTENING", tapToStop: "Tap to stop",
    audioCapture: "AUDIO CAPTURE", videoCapture: "VIDEO CAPTURE",
    reviewTitle: "READY TO SUBMIT", reviewSub: "Pick what happens next.",
    actionTag: "TAG TO CATEGORY", actionTagSub: "Becomes a draft Structured Report",
    actionSubmit: "SUBMIT RAW", actionSubmitSub: "Handler categorizes on intake",
    actionDiscard: "DISCARD", actionDiscardSub: "Cannot be undone",
    addVoiceContext: "Add voice context (10s)",
    photoTitle: "PHOTO CAPTURED", videoTitle: "VIDEO CAPTURED", audioTitle: "AUDIO CAPTURED", geoTitle: "GEO-PIN DROPPED",
    duration: "DUR", exifStripped: "EXIF STRIPPED", locationOffset: "LOC OFFSET",
    locationOffsetOn: "ON · ~250 m", locationOffsetOff: "OFF",
    mgrs: "MGRS", mgrsValue: "14R PU 64829 53117",
    discardTitle: "DISCARD CAPTURE?", discardBody: "The capture will be destroyed. There is no undo. Use this if the capture would compromise you or someone else.",
    discardConfirm: "Yes, discard", discardCancel: "Cancel",
    submitOk: "SUBMITTED · queued for sync",
    offsetLabel: "Location offset",

    structuredTitle: "WHAT ARE YOU REPORTING?", structuredSub: "Choose the category that best fits.",
    structuredVoiceHint: "Or speak — I'll pick a category", tasked: "TASKED", locked: "GATED",
    requestAccessTitle: "VETTING REQUIRED",
    requestAccessBody: "Reporting on corrupted officials carries operational, legal, and OPSEC weight. This category requires handler authorization before use.",
    requestAccessAction: "Acknowledged", requestAccessNote: "Access request workflow — coming in v0.3. No request is sent yet.",
    closeBtn: "Close", iaRef: "IA REF",
    subModalSubtitle: "Pick a sub-category to start the wizard.", subModalIaNote: "Always-prompted fields per IA §5.x will follow.",
    prePopBanner: "PRE-POP FROM TASK",

    droneTitle: "DRONE MISSION", droneSub: "Plan, fly, review.",
    droneStatus: "DRONE STATUS", droneModel: "MODEL", droneModelValue: "SIM-DRN-001",
    droneBattery: "BATT", droneGps: "GPS", droneLink: "LINK", droneConnected: "CONNECTED",
    droneNoMission: "NO ACTIVE MISSION", droneMissionId: "MSN-S7421-042",
    pathNew: "NEW MISSION", pathNewSub: "Plan waypoints, targets, no-fly zones",
    pathResume: "RESUME ACTIVE MISSION", pathResumeSub: "Continue mission in progress",
    pathHistory: "PAST MISSIONS", pathHistorySub: "Review completed flights",
    droneOpsec: "Drone launch creates visible signature. Launches are logged and pattern-checked.",
    preMissionTitle: "PRE-MISSION PLAN", preMissionSub: "Define waypoints, targets, and review no-fly zones.",
    missionIdLabel: "MISSION ID", missionNameLabel: "MISSION NAME",
    missionNamePlaceholder: "e.g., Reconnaissance — Compound Alpha",
    waypointsLabel: "WAYPOINTS", waypointsCount: "3 PLOTTED",
    noFlyLabel: "NO-FLY ZONES", noFlyCount: "1 ACTIVE IN AO",
    targetsLabel: "TARGETS", targetsCount: "1 ASSIGNED",
    targetExample: "Compound Alpha · 14R PU 64829 53117",
    estDurationLabel: "EST. DURATION", estDurationValue: "12 min",
    checklistTitle: "PRE-FLIGHT CHECKLIST",
    checkOpsec: "OPSEC acknowledgment — drone signature understood",
    checkOpsecSub: "Visible / audible launch may compromise position",
    checkNofly: "No-fly zones reviewed", checkNoflySub: "Restricted airspace + partner-nation sensitivities",
    checkBattery: "Battery > 80%", checkBatterySub: "Auto-checked from drone telemetry",
    checkGps: "GPS lock confirmed (≥8 sats)", checkGpsSub: "Auto-checked from drone telemetry",
    authStatus: "LAUNCH AUTHORIZATION", authPending: "PENDING REQUEST",
    authRequested: "REQUESTED · Awaiting handler", authApproved: "AUTHORIZED",
    authPendingHint: "Handler will receive request with mission plan",
    requestAuth: "Request Authorization", launchMission: "LAUNCH MISSION",
    launchBlocked: "Cannot launch — checklist + authorization required",
    flightTitle: "LIVE FLIGHT", altLabel: "ALT", spdLabel: "SPD", elapsedLabel: "ELAPSED",
    droneAt: "DRONE", nextWaypoint: "NEXT WP",
    capturePhoto: "PHOTO", captureVideo: "VIDEO", captureCount: "CAPTURED",
    rth: "RTH", abortMission: "ABORT MISSION", completeMission: "MISSION COMPLETE",
    abortTitle: "ABORT MISSION?",
    abortBody: "The drone will return to launch position immediately. Captured media will be retained. Mission will be marked aborted.",
    abortConfirm: "Yes, abort", abortCancel: "Continue mission",
    droneReviewTitle: "POST-MISSION REVIEW", droneReviewSub: "Auto-tagged captures. Tag, submit, or discard.",
    missionSummary: "MISSION SUMMARY", summaryDuration: "DURATION", summaryDistance: "DISTANCE", summaryCaptures: "CAPTURES",
    statusComplete: "COMPLETE", statusAborted: "ABORTED",
    routePlayback: "FLIGHT ROUTE", capturesLabel: "CAPTURES",
    submitMissionReport: "SUBMIT MISSION REPORT", submitMissionSub: "All captures + telemetry + route into validation queue",
    captureTagged: "AUTO-TAGGED", capPhoto: "PHOTO", capVideo: "VIDEO", capTime: "T+",

    draftsTitle: "MY DRAFTS", draftsSub: "Resume or sync queued reports",
    draftsEmpty: "Captures and reports awaiting sync will appear here.",
    draftsPlaceholderNote: "PLACEHOLDER · Full drafts UI is a future POC iteration.",
    secureTitle: "SECURE / DURESS", secureSub: "Emergency tools",
    securePanic: "Panic Wipe", securePanicSub: "Triggers device wipe + covert distress signal",
    secureDistress: "Distress Signal", secureDistressSub: "Silent alert to handler · no UI confirmation",
    secureContact: "Emergency Handler Contact", secureContactSub: "Voice channel to active handler",
    securePlaceholderNote: "PLACEHOLDER · Each affordance triggers serious force-protection workflows in production.",

    toastDeferred: "Tasking acknowledged · deferred · handler notified",
    toastConcern: "Concern logged · forwarded to handler + legal",
    toastReply: "Handler messaging — POC stub", toastVoice: "Voice context — POC stub",
    toastRTH: "Drone returning to launch — POC stub",
    toastFutureScreen: "Feature scheduled for future iteration",
    toastDiscarded: "Capture discarded", toastSubmitted: "Mission submitted · queued for sync",
    toastDuress: "DURESS PROTOCOL — would trigger device wipe + distress signal",
    toastResume: "No active mission to resume", toastPast: "Past Missions list — future iteration",
    toastTagged: "Capture queued · auto-tagged with time + MGRS",

    // Wizard — PERSON > New person seen
    wizardBreadcrumb: "PERSON · NEW",
    stepOf: "STEP", of: "OF",
    voicePrompt: "Or speak — I'll fill it in",
    wzNext: "NEXT", wzSubmit: "SUBMIT REPORT",
    wzBack: "BACK", wzSkip: "Skip — I don't know",
    step1Title: "WHO DID YOU SEE?",
    step1Sub: "Tell me about the person. Any field can be left blank.",
    sexLabel: "SEX", ageLabel: "APPROXIMATE AGE", buildLabel: "BUILD",
    featuresLabel: "DISTINGUISHING FEATURES",
    featuresPlaceholder: "Tattoos, scars, walks with limp, missing finger, accent...",
    step2Title: "WHERE & WHEN", step2Sub: "Location and time of observation.",
    locationLabel: "LOCATION",
    namedPlaceLabel: "NAMED PLACE (optional)",
    namedPlacePlaceholder: "e.g., Plaza Allende café, Hwy 23 access road",
    wzOffsetLabel: "Location offset for source protection",
    wzOffsetOnDesc: "Pin shifted ~250 m from your real position",
    wzOffsetOffDesc: "Real position will be reported (handler discretion)",
    timeLabel: "WHEN",
    activityLabel: "WHAT WERE THEY DOING?",
    activityPlaceholder: "e.g., Met two men at the back table, exchanged a bag, left in white SUV",
    step3Title: "PHOTO & VOICE",
    step3Sub: "Add a photo or voice note if it's safe to.",
    wzPhotoLabel: "PHOTO",
    wzPhotoEmptyHint: "Tap to capture · EXIF stripped on submit",
    wzPhotoAttached: "Photo attached",
    wzPhotoRemove: "Remove",
    wzVoiceLabel: "VOICE CONTEXT",
    wzVoiceEmptyHint: "Tap to record · Auto-transcribes after sync",
    wzVoiceAttached: "Voice note attached",
    wzRecording: "RECORDING...",
    step4Title: "REVIEW & SUBMIT",
    step4Sub: "Quick check before this goes to your handler.",
    summaryLabel: "WHAT YOU REPORTED", summaryEmpty: "(not provided)",
    basisLabel: "HOW DO YOU KNOW THIS?",
    basisHint: "Defaults to direct observation. Change if applicable.",
    confidenceLabel: "YOUR CONFIDENCE",
    confidenceHint: "How sure are you? · IA §9 #6",
    confidenceRequired: "Set your confidence level to enable submit",
    legalNote: "Submitting attests to your honest belief in this report's accuracy.",
    sumWho: "WHO", sumWhere: "WHERE", sumWhen: "WHEN", sumActivity: "ACTIVITY", sumMedia: "MEDIA",
    sumPhoto: "Photo", sumVoice: "Voice",
    submittedTitle: "REPORT SUBMITTED", submittedSub: "Queued for sync · pending validation",

    // Login (POC demo auth)
    authBreadcrumb: "AUTH",
    authTitle: "HARS",
    authSub: "HUMINT Advanced Reporting System",
    authCallsignLabel: "CALLSIGN",
    authCallsignPlaceholder: "e.g., S-7421",
    authPasscodeLabel: "PASSCODE",
    authPasscodePlaceholder: "Enter your passcode",
    authLoginButton: "LOG IN",
    authLoginBlocked: "Enter callsign and passcode",
    authDividerOr: "OR",
    authBiometricLabel: "FACE ID",
    authBiometricHint: "Tap to unlock with biometric",
    authBiometricUnlocking: "AUTHENTICATING...",
    authDemoBanner: "POC demo auth · production uses device pairing + Secure Enclave per ICP §8",
    authLogoutButton: "LOG OUT",
    authLogoutSub: "Returns to callsign / passcode screen",
  },
  es: {
    classification: "DEMO // HUMINT SIMULADO // NO ES INTELIGENCIA REAL",
    demoLine: "DEMO // NO ES REAL",
    backLabel: "ATRÁS", sourceLabel: "FNT",
    appVer: "HARS POC · INTEGRADO · v1.0", queue: "en cola", syncOffline: "SIN CONEXIÓN",
    homeBreadcrumb: "HARS", modeBreadcrumb: "INICIO · RECOLECTAR",
    instructionsBreadcrumb: "INICIO · TAREAS", taskBreadcrumb: "TAREAS · DETALLE",
    qcBreadcrumb: "INICIO · RECOLECTAR · RÁPIDA", structuredBreadcrumb: "INICIO · RECOLECTAR · GUIADO",
    droneBreadcrumb: "INICIO · RECOLECTAR · DRON", preMissionBreadcrumb: "DRON · PLAN",
    flightBreadcrumb: "DRON · VUELO", reviewBreadcrumb: "DRON · REVISIÓN",
    draftsBreadcrumb: "INICIO · BORRADORES", secureBreadcrumb: "INICIO · SEGURIDAD",

    arsTitle: "HARS", arsSub: "Sistema Avanzado de Reportes HUMINT", homeGreeting: "EN ESPERA",
    homeInstructions: "MIS TAREAS", homeInstructionsSub: "Instrucciones de su contacto", homeInstructionsBadge: "3 NUEVAS",
    homeCollect: "RECOLECTAR Y REPORTAR", homeCollectSub: "Capturar — foto, audio o asistente",
    homeDrafts: "MIS BORRADORES", homeDraftsSub: "Continuar o sincronizar reportes",
    homeSecure: "SEGURIDAD / COACCIÓN", homeSecureSub: "Herramientas de emergencia",

    modeTitle: "¿CÓMO DESEA REPORTAR?", modeSubtitle: "Tres modos de captura.",
    modeQuick: "CAPTURA RÁPIDA", modeQuickSub: "Sólo grabe — etiquete después", modeQuickHint: "Foto · Video · Audio",
    modeStructured: "REPORTE GUIADO", modeStructuredSub: "Reporte guiado por categoría", modeStructuredHint: "8 categorías",
    modeDrone: "MISIÓN DE DRON", modeDroneSub: "Lanzamiento desde dron", modeDroneHint: "Pre · Vuelo · Post",

    miTitle: "MIS TAREAS", miSub: "Instrucciones de su contacto",
    tabActive: "ACTIVAS", tabStanding: "PERMAN.", tabCompleted: "HECHAS", tabMessages: "MSG",
    pTimeSensitive: "URGENTE", pPriority: "PRIORIDAD", pRoutine: "RUTINA",
    newPill: "NUEVA", dueLabel: "VENCE", overdueLabel: "VENCIDA",
    days: "d", hours: "h", minutes: "m", activeEmpty: "Sin tareas activas.",
    standingPersistentLabel: "PERMANENTE · SIN VENCIMIENTO", standingActiveSince: "ACTIVA DESDE",
    statusValidated: "VALIDADA", statusPending: "PENDIENTE VALIDACIÓN", statusRejected: "RECHAZADA",
    completedSubmittedAt: "ENVIADA", msgUnread: "NO LEÍDO", msgReply: "RESPONDER",

    tdHeaderIssued: "EMITIDA", tdHeaderHandler: "CONTACTO", tdHeaderLegal: "REVISIÓN LEGAL",
    tdTarget: "OBJETIVO", tdGuidance: "INSTRUCCIONES", tdConstraints: "RESTRICCIONES",
    tdLinkedCategory: "CATEGORÍA", tdPirAlignment: "PIR",
    startReport: "EMPEZAR REPORTE", startReportSub: "Pre-llena la categoría correcta",
    reportConcern: "Reportar inquietud", acknowledgeDefer: "Acusar · diferir",
    concernTitle: "REPORTAR INQUIETUD",
    concernBody: "Use esto si una tarea se siente operacionalmente errónea, peligrosa, o fuera de lo usual. Su contacto y legal lo revisarán. No será penalizado.",
    concernExamples: "Ejemplos: pide quebrantar la ley · lo pone en peligro · siente que lo prueban",
    concernPlaceholder: "Describa brevemente...", concernSend: "Enviar a contacto + legal", concernCancel: "Cancelar",

    qcTitle: "CAPTURA RÁPIDA", qcSub: "Sólo grabe. Etiquete después.",
    photo: "FOTO", photoHint: "Sencilla o ráfaga", video: "VIDEO", videoHint: "Corto — eficiente",
    audio: "AUDIO", audioHint: "Voz o ambiental", geoPin: "GEO-PIN", geoPinHint: "Suelte un pin",
    qcProtection: "EXIF removido · offset activo · cifrado",
    recording: "GRABANDO", listening: "ESCUCHANDO", tapToStop: "Toque para detener",
    audioCapture: "CAPTURA DE AUDIO", videoCapture: "CAPTURA DE VIDEO",
    reviewTitle: "LISTO PARA ENVIAR", reviewSub: "Elija qué sigue.",
    actionTag: "ETIQUETAR", actionTagSub: "Se vuelve borrador",
    actionSubmit: "ENVIAR EN BRUTO", actionSubmitSub: "El contacto categoriza al recibir",
    actionDiscard: "DESCARTAR", actionDiscardSub: "No se puede deshacer",
    addVoiceContext: "Agregar contexto de voz (10s)",
    photoTitle: "FOTO CAPTURADA", videoTitle: "VIDEO CAPTURADO", audioTitle: "AUDIO CAPTURADO", geoTitle: "GEO-PIN MARCADO",
    duration: "DUR", exifStripped: "EXIF REMOVIDO", locationOffset: "OFFSET UBIC.",
    locationOffsetOn: "ACT · ~250 m", locationOffsetOff: "INACT",
    mgrs: "MGRS", mgrsValue: "14R PU 64829 53117",
    discardTitle: "¿DESCARTAR CAPTURA?", discardBody: "La captura será destruida. No hay forma de recuperarla.",
    discardConfirm: "Sí, descartar", discardCancel: "Cancelar",
    submitOk: "ENVIADO · en cola",
    offsetLabel: "Offset de ubicación",

    structuredTitle: "¿QUÉ ESTÁ REPORTANDO?", structuredSub: "Elija la categoría.",
    structuredVoiceHint: "O hable — yo elijo categoría", tasked: "TAREA", locked: "GATED",
    requestAccessTitle: "VETTING REQUERIDO",
    requestAccessBody: "Reportar sobre funcionarios corruptos tiene peso operativo, legal y de OPSEC. Requiere autorización del contacto.",
    requestAccessAction: "Entendido", requestAccessNote: "Flujo de solicitud de acceso — próximamente en v0.3. No se envía solicitud aún.",
    closeBtn: "Cerrar", iaRef: "REF IA",
    subModalSubtitle: "Elija una sub-categoría.", subModalIaNote: "Los campos siempre solicitados (IA §5.x) seguirán.",
    prePopBanner: "PRE-LLENADO POR TAREA",

    droneTitle: "MISIÓN DE DRON", droneSub: "Planee, vuele, revise.",
    droneStatus: "ESTADO", droneModel: "MODELO", droneModelValue: "SIM-DRN-001",
    droneBattery: "BAT", droneGps: "GPS", droneLink: "ENLACE", droneConnected: "CONECTADO",
    droneNoMission: "SIN MISIÓN ACTIVA", droneMissionId: "MSN-S7421-042",
    pathNew: "NUEVA MISIÓN", pathNewSub: "Plotear waypoints, blancos",
    pathResume: "REANUDAR", pathResumeSub: "Continuar en progreso",
    pathHistory: "PASADAS", pathHistorySub: "Revisar vuelos completados",
    droneOpsec: "El lanzamiento crea firma visible. Los lanzamientos se registran.",
    preMissionTitle: "PLAN PRE-MISIÓN", preMissionSub: "Defina waypoints y revise restricciones.",
    missionIdLabel: "ID DE MISIÓN", missionNameLabel: "NOMBRE",
    missionNamePlaceholder: "p.ej., Reconocimiento — Complejo Alfa",
    waypointsLabel: "WAYPOINTS", waypointsCount: "3 PLOTEADOS",
    noFlyLabel: "ZONAS RESTRINGIDAS", noFlyCount: "1 ACTIVA",
    targetsLabel: "BLANCOS", targetsCount: "1 ASIGNADO",
    targetExample: "Complejo Alfa · 14R PU 64829 53117",
    estDurationLabel: "DURACIÓN EST.", estDurationValue: "12 min",
    checklistTitle: "LISTA DE VERIFICACIÓN",
    checkOpsec: "Reconocimiento OPSEC — firma del dron entendida",
    checkOpsecSub: "Lanzamiento puede comprometer posición",
    checkNofly: "Zonas restringidas revisadas", checkNoflySub: "Espacio aéreo + partner",
    checkBattery: "Batería > 80%", checkBatterySub: "Auto-verificado",
    checkGps: "Bloqueo GPS (≥8 sat)", checkGpsSub: "Auto-verificado",
    authStatus: "AUTORIZACIÓN", authPending: "PENDIENTE",
    authRequested: "SOLICITADA · Esperando", authApproved: "AUTORIZADA",
    authPendingHint: "El contacto recibirá la solicitud",
    requestAuth: "Solicitar autorización", launchMission: "LANZAR MISIÓN",
    launchBlocked: "Falta lista o autorización",
    flightTitle: "VUELO EN VIVO", altLabel: "ALT", spdLabel: "VEL", elapsedLabel: "TIEMPO",
    droneAt: "DRON", nextWaypoint: "PRÓX WP",
    capturePhoto: "FOTO", captureVideo: "VIDEO", captureCount: "CAPTURADO",
    rth: "RTH", abortMission: "ABORTAR", completeMission: "COMPLETA",
    abortTitle: "¿ABORTAR MISIÓN?",
    abortBody: "El dron regresará a la base. Las capturas se conservan. La misión quedará abortada.",
    abortConfirm: "Sí, abortar", abortCancel: "Continuar",
    droneReviewTitle: "REVISIÓN POST-MISIÓN", droneReviewSub: "Capturas auto-etiquetadas.",
    missionSummary: "RESUMEN", summaryDuration: "DURACIÓN", summaryDistance: "DISTANCIA", summaryCaptures: "CAPTURAS",
    statusComplete: "COMPLETA", statusAborted: "ABORTADA",
    routePlayback: "RUTA", capturesLabel: "CAPTURAS",
    submitMissionReport: "ENVIAR REPORTE", submitMissionSub: "Capturas + telemetría + ruta",
    captureTagged: "AUTO-ETIQUETADO", capPhoto: "FOTO", capVideo: "VIDEO", capTime: "T+",

    draftsTitle: "MIS BORRADORES", draftsSub: "Continuar o sincronizar",
    draftsEmpty: "Las capturas en espera aparecerán aquí.",
    draftsPlaceholderNote: "PLACEHOLDER · Iteración futura del POC.",
    secureTitle: "SEGURIDAD / COACCIÓN", secureSub: "Herramientas de emergencia",
    securePanic: "Borrado de Pánico", securePanicSub: "Borra el dispositivo + señal",
    secureDistress: "Señal de Auxilio", secureDistressSub: "Alerta silenciosa al contacto",
    secureContact: "Contacto de Emergencia", secureContactSub: "Canal de voz al contacto",
    securePlaceholderNote: "PLACEHOLDER · Cada acción dispara protocolos serios en producción.",

    toastDeferred: "Tarea acusada · diferida", toastConcern: "Inquietud registrada",
    toastReply: "Mensajería — POC simulado", toastVoice: "Voz — POC simulado",
    toastRTH: "Dron regresando — POC simulado",
    toastFutureScreen: "Función para iteración futura",
    toastDiscarded: "Captura descartada", toastSubmitted: "Misión enviada · en cola",
    toastDuress: "PROTOCOLO COACCIÓN — borraría dispositivo",
    toastResume: "No hay misión activa", toastPast: "Misiones pasadas — iteración futura",
    toastTagged: "Captura en cola · auto-etiquetada",

    // Wizard — PERSONA > Nueva persona
    wizardBreadcrumb: "PERSONA · NUEVA",
    stepOf: "PASO", of: "DE",
    voicePrompt: "O hable — yo lo lleno",
    wzNext: "SIGUIENTE", wzSubmit: "ENVIAR REPORTE",
    wzBack: "ATRÁS", wzSkip: "Saltar — no sé",
    step1Title: "¿A QUIÉN VIO?",
    step1Sub: "Cuénteme sobre la persona. Puede dejar campos en blanco.",
    sexLabel: "SEXO", ageLabel: "EDAD APROX.", buildLabel: "COMPLEXIÓN",
    featuresLabel: "RASGOS DISTINTIVOS",
    featuresPlaceholder: "Tatuajes, cicatrices, cojea, le falta un dedo, acento...",
    step2Title: "DÓNDE Y CUÁNDO", step2Sub: "Lugar y hora de la observación.",
    locationLabel: "UBICACIÓN",
    namedPlaceLabel: "LUGAR CONOCIDO (opcional)",
    namedPlacePlaceholder: "p.ej., café Plaza Allende, acceso Hwy 23",
    wzOffsetLabel: "Offset de ubicación para protección",
    wzOffsetOnDesc: "Pin desplazado ~250 m de su posición real",
    wzOffsetOffDesc: "Se reportará la posición real (a discreción del contacto)",
    timeLabel: "CUÁNDO",
    activityLabel: "¿QUÉ ESTABAN HACIENDO?",
    activityPlaceholder: "p.ej., Se reunió con dos hombres, intercambió una bolsa, se fue en SUV blanca",
    step3Title: "FOTO Y VOZ", step3Sub: "Agregue foto o nota de voz si es seguro.",
    wzPhotoLabel: "FOTO",
    wzPhotoEmptyHint: "Toque para capturar · EXIF removido al enviar",
    wzPhotoAttached: "Foto adjunta", wzPhotoRemove: "Quitar",
    wzVoiceLabel: "CONTEXTO DE VOZ",
    wzVoiceEmptyHint: "Toque para grabar · Auto-transcribe al sincronizar",
    wzVoiceAttached: "Nota de voz adjunta", wzRecording: "GRABANDO...",
    step4Title: "REVISAR Y ENVIAR",
    step4Sub: "Revisión antes de enviar al contacto.",
    summaryLabel: "LO QUE REPORTÓ", summaryEmpty: "(no provisto)",
    basisLabel: "¿CÓMO LO SABE?", basisHint: "Por defecto: observación directa.",
    confidenceLabel: "SU CONFIANZA", confidenceHint: "¿Qué tan seguro? · IA §9 #6",
    confidenceRequired: "Marque su confianza para habilitar enviar",
    legalNote: "Al enviar atesta su creencia honesta en la exactitud de este reporte.",
    sumWho: "QUIÉN", sumWhere: "DÓNDE", sumWhen: "CUÁNDO", sumActivity: "ACTIVIDAD", sumMedia: "MEDIOS",
    sumPhoto: "Foto", sumVoice: "Voz",
    submittedTitle: "REPORTE ENVIADO", submittedSub: "En cola · pendiente validación",

    // Login (POC demo auth)
    authBreadcrumb: "AUTH",
    authTitle: "HARS",
    authSub: "Sistema Avanzado de Reportes HUMINT",
    authCallsignLabel: "INDICATIVO",
    authCallsignPlaceholder: "p.ej., S-7421",
    authPasscodeLabel: "CÓDIGO",
    authPasscodePlaceholder: "Ingrese su código",
    authLoginButton: "INGRESAR",
    authLoginBlocked: "Ingrese indicativo y código",
    authDividerOr: "O",
    authBiometricLabel: "FACE ID",
    authBiometricHint: "Toque para desbloquear con biométrico",
    authBiometricUnlocking: "AUTENTICANDO...",
    authDemoBanner: "Auth de POC · producción usa Secure Enclave por ICP §8",
    authLogoutButton: "CERRAR SESIÓN",
    authLogoutSub: "Regresa a pantalla de indicativo",
  },
};

// =============================================================================
// SHARED COMPONENTS
// =============================================================================
function CornerBrackets({ color = AMBER }) {
  return (
    <>
      <div className="absolute top-0 left-0 w-2 h-2" style={{ borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <div className="absolute top-0 right-0 w-2 h-2" style={{ borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
      <div className="absolute bottom-0 left-0 w-2 h-2" style={{ borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <div className="absolute bottom-0 right-0 w-2 h-2" style={{ borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
    </>
  );
}

function Toast({ text }) {
  if (!text) return null;
  return (
    <div className="absolute z-[60] left-1/2 -translate-x-1/2"
      style={{ top: 100, background: "rgba(20,20,22,0.97)", border: `1px solid ${HAIRLINE_STRONG}`, padding: "9px 14px",
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, letterSpacing: "0.08em",
        whiteSpace: "nowrap", maxWidth: "92%", boxShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>
      {text}
    </div>
  );
}

function SyncBanner({ queueCount, t }) {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (online) return null;
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5"
      style={{ border: `1px solid rgba(245,158,11,0.3)`, background: "rgba(245,158,11,0.05)" }}>
      <WifiOff size={11} style={{ color: ORANGE }} strokeWidth={1.5} />
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: ORANGE, letterSpacing: "0.1em" }}>
        {t.syncOffline} · {queueCount} {t.queue}
      </span>
    </div>
  );
}

// =============================================================================
// MODALS (all)
// =============================================================================
function GatedModal({ open, t, onClose }) {
  if (!open) return null;
  return (
    <div onClick={onClose} className="absolute inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)" }}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full"
        style={{ background: PANEL, border: `1px solid ${HAIRLINE_STRONG}`, padding: 18 }}>
        <CornerBrackets color={AMBER} />
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center justify-center" style={{ width: 36, height: 36, border: `1px solid ${AMBER}`, color: AMBER, flexShrink: 0 }}>
            <Lock size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14, color: AMBER, letterSpacing: "0.1em" }}>{t.requestAccessTitle}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.12em", marginTop: 2 }}>IA §5.7 · §9 #7</div>
          </div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: "rgba(245,245,244,0.7)", lineHeight: 1.55, marginBottom: 14 }}>{t.requestAccessBody}</div>
        <button onClick={onClose} className="w-full py-3 mb-2"
          style={{ background: AMBER, color: BG, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em" }}>
          {t.requestAccessAction}
        </button>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: "rgba(245,245,244,0.4)", marginTop: 12, lineHeight: 1.5, textAlign: "center" }}>{t.requestAccessNote}</div>
      </div>
    </div>
  );
}

function SubCategoryModal({ open, cat, lang, t, onClose, onPickSub }) {
  if (!open || !cat) return null;
  return (
    <div onClick={onClose} className="absolute inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(2px)" }}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full"
        style={{ background: PANEL, border: `1px solid ${HAIRLINE_STRONG}`, borderBottom: "none", maxHeight: "88%", overflow: "auto" }}>
        <div className="flex items-center justify-between px-4 py-3 sticky top-0"
          style={{ borderBottom: `1px solid ${HAIRLINE}`, background: PANEL, zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.15em" }}>{t.iaRef} · {cat.iaRef}</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: "0.08em", color: AMBER, marginTop: 2 }}>{cat.title[lang]}</div>
            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.55)", marginTop: 4, lineHeight: 1.4 }}>{t.subModalSubtitle}</div>
          </div>
          <button onClick={onClose} className="flex items-center justify-center"
            style={{ width: 28, height: 28, border: `1px solid ${HAIRLINE_STRONG}`, color: AMBER, flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-3 space-y-2">
          {cat.subs.map((s, i) => (
            <button key={i} onClick={() => onPickSub(cat.key, s.key)}
              className="w-full text-left flex items-start gap-3 p-3 transition-all active:scale-[0.99]"
              style={{ border: `1px solid ${s.hint?.danger ? "rgba(220,38,38,0.35)" : HAIRLINE}`, background: "rgba(255,255,255,0.01)" }}>
              <div className="flex items-center justify-center mt-0.5"
                style={{ width: 24, height: 24, border: `1px solid ${s.hint?.danger ? RED : AMBER_DIM}`,
                  color: s.hint?.danger ? RED : AMBER, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex-1">
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 500, fontSize: 13, color: s.hint?.danger ? "#FCA5A5" : "#F5F5F4", letterSpacing: "0.04em" }}>{s[lang]}</div>
                {s.hint && <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 2, lineHeight: 1.4 }}>{s.hint[lang]}</div>}
              </div>
              <ChevronRight size={14} style={{ color: AMBER_DIM, marginTop: 4 }} strokeWidth={1.5} />
            </button>
          ))}
          <div className="text-center pt-2 pb-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.12em" }}>
            ── {t.subModalIaNote.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiscardModal({ open, t, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div onClick={onCancel} className="absolute inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)" }}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full"
        style={{ background: PANEL, border: `1px solid rgba(220,38,38,0.5)`, padding: 18 }}>
        <CornerBrackets color={RED} />
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center justify-center" style={{ width: 36, height: 36, border: `1px solid ${RED}`, color: RED, flexShrink: 0 }}>
            <AlertTriangle size={18} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14, color: "#FCA5A5", letterSpacing: "0.1em" }}>{t.discardTitle}</div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: "rgba(245,245,244,0.7)", lineHeight: 1.55, marginBottom: 14 }}>{t.discardBody}</div>
        <button onClick={onConfirm} className="w-full py-3 mb-2"
          style={{ background: RED, color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em" }}>
          {t.discardConfirm}
        </button>
        <button onClick={onCancel} className="w-full py-2"
          style={{ background: "transparent", color: AMBER_DIM, fontFamily: "'Rajdhani', sans-serif", fontSize: 12, letterSpacing: "0.08em", border: `1px solid ${HAIRLINE}` }}>
          {t.discardCancel}
        </button>
      </div>
    </div>
  );
}

function AbortModal({ open, t, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div onClick={onCancel} className="absolute inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)" }}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full"
        style={{ background: PANEL, border: `1px solid rgba(220,38,38,0.5)`, padding: 18 }}>
        <CornerBrackets color={RED} />
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center justify-center" style={{ width: 36, height: 36, border: `1px solid ${RED}`, color: RED, flexShrink: 0 }}>
            <AlertTriangle size={18} strokeWidth={1.5} />
          </div>
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14, color: "#FCA5A5", letterSpacing: "0.1em" }}>{t.abortTitle}</div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: "rgba(245,245,244,0.7)", lineHeight: 1.55, marginBottom: 14 }}>{t.abortBody}</div>
        <button onClick={onConfirm} className="w-full py-3 mb-2"
          style={{ background: RED, color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em" }}>
          {t.abortConfirm}
        </button>
        <button onClick={onCancel} className="w-full py-2"
          style={{ background: "transparent", color: AMBER_DIM, fontFamily: "'Rajdhani', sans-serif", fontSize: 12, letterSpacing: "0.08em", border: `1px solid ${HAIRLINE}` }}>
          {t.abortCancel}
        </button>
      </div>
    </div>
  );
}

function ConcernModal({ open, t, onClose, onSend }) {
  const [text, setText] = useState("");
  if (!open) return null;
  const canSend = text.trim().length >= 10;
  return (
    <div onClick={onClose} className="absolute inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(3px)" }}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full"
        style={{ background: PANEL, border: `1px solid ${ORANGE}`, padding: 18 }}>
        <CornerBrackets color={ORANGE} />
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center justify-center" style={{ width: 36, height: 36, border: `1px solid ${ORANGE}`, color: ORANGE, flexShrink: 0 }}>
            <Scale size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14, color: ORANGE, letterSpacing: "0.1em" }}>{t.concernTitle}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.12em", marginTop: 2 }}>ICP §8 · ANTI-ENTRAPMENT GUARD</div>
          </div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "rgba(245,245,244,0.7)", lineHeight: 1.55, marginBottom: 10 }}>{t.concernBody}</div>
        <div className="px-2.5 py-2 mb-3"
          style={{ background: BG, border: `1px dashed ${HAIRLINE}`, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", lineHeight: 1.5, fontStyle: "italic" }}>
          {t.concernExamples}
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.concernPlaceholder} rows={3}
          className="w-full px-2.5 py-2 outline-none mb-3"
          style={{ background: BG, border: `1px solid ${HAIRLINE_STRONG}`, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "#F5F5F4" }} />
        <button onClick={() => { if (canSend) { onSend(text); setText(""); } }} disabled={!canSend} className="w-full py-2 mb-2"
          style={{ background: canSend ? ORANGE : "transparent", color: canSend ? BG : AMBER_DIM,
            border: `1px solid ${canSend ? ORANGE : HAIRLINE}`, fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", cursor: canSend ? "pointer" : "not-allowed" }}>
          {t.concernSend}
        </button>
        <button onClick={() => { setText(""); onClose(); }} className="w-full py-2"
          style={{ background: "transparent", color: AMBER_DIM, fontFamily: "'Rajdhani', sans-serif", fontSize: 12, letterSpacing: "0.08em", border: `1px solid ${HAIRLINE}` }}>
          {t.concernCancel}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// HOME-SCREEN HELPERS (used in turn 1)
// =============================================================================
function HomeCard({ icon: Icon, title, sub, badge, accent = AMBER, onTap, danger = false }) {
  return (
    <button onClick={onTap} className="relative w-full text-left transition-all duration-100 active:scale-[0.99]"
      style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${danger ? "rgba(220,38,38,0.45)" : HAIRLINE_STRONG}`, padding: "18px 16px" }}>
      <CornerBrackets color={danger ? RED : accent} />
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center" style={{ width: 44, height: 44, border: `1px solid ${danger ? RED : accent}`, color: danger ? RED : accent }}>
          <Icon size={22} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 15, color: danger ? "#FCA5A5" : "#F5F5F4", letterSpacing: "0.08em" }}>{title}</div>
            {badge && <span className="text-[10px] px-1.5 py-0.5"
              style={{ fontFamily: "'JetBrains Mono', monospace", background: danger ? RED : accent, color: BG, letterSpacing: "0.05em" }}>{badge}</span>}
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "rgba(245,245,244,0.55)", marginTop: 2 }}>{sub}</div>
        </div>
        <ChevronRight size={18} style={{ color: danger ? "#FCA5A5" : AMBER_DIM }} strokeWidth={1.5} />
      </div>
    </button>
  );
}

// =============================================================================
// HELPERS / ROWS / CARDS — added in Turn 2
// =============================================================================
function ModeCard({ icon: Icon, title, sub, hint, onTap }) {
  return (
    <button onClick={onTap} className="relative w-full text-left transition-all duration-100 active:scale-[0.99]"
      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE_STRONG}`, padding: "16px 14px" }}>
      <CornerBrackets color={AMBER} />
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center" style={{ width: 44, height: 44, border: `1px solid ${AMBER}`, color: AMBER }}>
          <Icon size={22} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 14, color: "#F5F5F4", letterSpacing: "0.08em" }}>{title}</div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.55)", marginTop: 2 }}>{sub}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.1em", marginTop: 4 }}>{hint}</div>
        </div>
        <ChevronRight size={16} style={{ color: AMBER_DIM }} strokeWidth={1.5} />
      </div>
    </button>
  );
}

function TabBar({ tab, setTab, t, activeCount, msgCount }) {
  const tabs = [
    { id: "active", label: t.tabActive, badge: activeCount },
    { id: "standing", label: t.tabStanding, badge: null },
    { id: "completed", label: t.tabCompleted, badge: null },
    { id: "messages", label: t.tabMessages, badge: msgCount },
  ];
  return (
    <div className="flex gap-1.5 px-4">
      {tabs.map((tt) => {
        const active = tab === tt.id;
        return (
          <button key={tt.id} onClick={() => setTab(tt.id)}
            className="flex-1 py-1.5 flex items-center justify-center gap-1.5 transition-all"
            style={{ background: active ? AMBER : "transparent", color: active ? BG : AMBER,
              border: `1px solid ${active ? AMBER : HAIRLINE_STRONG}`, fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 600, fontSize: 10.5, letterSpacing: "0.1em" }}>
            {tt.label}
            {tt.badge != null && tt.badge > 0 && (
              <span className="px-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                background: active ? BG : AMBER, color: active ? AMBER : BG, letterSpacing: "0.05em" }}>{tt.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PriorityPill({ priority, t }) {
  const map = {
    "time-sensitive": { label: t.pTimeSensitive, color: RED, bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.5)" },
    "priority": { label: t.pPriority, color: ORANGE, bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.5)" },
    "routine": { label: t.pRoutine, color: AMBER_DIM, bg: "transparent", border: HAIRLINE_STRONG },
  };
  const p = map[priority];
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5"
      style={{ background: p.bg, border: `1px solid ${p.border}`, color: p.color,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.1em", fontWeight: 600 }}>
      <CircleDot size={8} strokeWidth={2.5} />{p.label}
    </span>
  );
}

function formatDeadline(mins, t) {
  if (mins <= 0) return { text: t.overdueLabel, color: RED, bold: true };
  const d = Math.floor(mins / (24 * 60));
  const h = Math.floor((mins % (24 * 60)) / 60);
  const m = mins % 60;
  let text = "";
  if (d >= 1) text = `${d}${t.days} ${h}${t.hours}`;
  else if (h >= 1) text = `${h}${t.hours} ${m}${t.minutes}`;
  else text = `${m}${t.minutes}`;
  let color = AMBER_DIM;
  if (mins < 6 * 60) color = RED;
  else if (mins < 24 * 60) color = ORANGE;
  return { text, color, bold: mins < 6 * 60 };
}

function TaskRow({ task, lang, onTap }) {
  const t = COPY[lang];
  const hasDeadline = task.deadlineMinutes != null;
  const dl = hasDeadline ? formatDeadline(task.deadlineMinutes, t) : { text: "NO DEADLINE", color: AMBER_DIM, bold: false };
  return (
    <button onClick={onTap} className="relative w-full text-left transition-all active:scale-[0.99]"
      style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${HAIRLINE_STRONG}`, padding: "10px 12px" }}>
      <CornerBrackets color={AMBER} />
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityPill priority={task.priority} t={t} />
          {task.fresh && <span className="px-1.5 py-0.5"
            style={{ background: AMBER, color: BG, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.08em", fontWeight: 600 }}>{t.newPill}</span>}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: dl.color, letterSpacing: "0.08em", fontWeight: dl.bold ? 700 : 400 }}>
          {hasDeadline ? `${t.dueLabel} ${dl.text}` : dl.text}
        </span>
      </div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, color: "#F5F5F4", letterSpacing: "0.04em", lineHeight: 1.25, marginBottom: 3 }}>{task.title}</div>
      <div className="flex items-center justify-between mt-1.5">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.08em" }}>{task.id} · {task.pir}</span>
        <ChevronRight size={14} style={{ color: AMBER_DIM }} strokeWidth={1.5} />
      </div>
    </button>
  );
}

function StandingRow({ sr, lang }) {
  const t = COPY[lang];
  return (
    <div className="relative w-full p-3" style={{ background: "rgba(255,255,255,0.015)", border: `1px dashed ${HAIRLINE_STRONG}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5"
          style={{ background: "rgba(125,211,252,0.08)", border: "1px solid rgba(125,211,252,0.4)", color: "#7DD3FC",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.1em", fontWeight: 600 }}>
          <Pin size={8} strokeWidth={2.5} />{t.standingPersistentLabel}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.08em" }}>{sr.id}</span>
      </div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, color: "#F5F5F4", letterSpacing: "0.04em", marginBottom: 4 }}>{sr.title}</div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11.5, color: "rgba(245,245,244,0.6)", lineHeight: 1.5, marginBottom: 6 }}>{sr.desc}</div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {sr.pirs.map((p) => <span key={p} className="px-1.5 py-0.5"
            style={{ border: `1px solid ${HAIRLINE}`, color: AMBER, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em" }}>{p}</span>)}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.08em" }}>{t.standingActiveSince} · {sr.activeSince}</span>
      </div>
    </div>
  );
}

function CompletedRow({ task, lang }) {
  const t = COPY[lang];
  const map = {
    validated: { label: t.statusValidated, color: GREEN, icon: CheckCircle2 },
    pending: { label: t.statusPending, color: ORANGE, icon: Clock },
    rejected: { label: t.statusRejected, color: RED, icon: AlertCircle },
    on_hold: { label: "ON HOLD", color: AMBER_DIM, icon: Clock },
  };
  const s = map[task.status] || map.pending;
  const StatusIcon = s.icon;
  return (
    <div className="w-full p-2.5" style={{ background: "rgba(255,255,255,0.012)", border: `1px solid ${HAIRLINE}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 500, fontSize: 12.5, color: "rgba(245,245,244,0.85)", letterSpacing: "0.04em", lineHeight: 1.25 }}>{task.title}</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.08em" }}>{task.id} · {t.completedSubmittedAt} {task.submittedAt}</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 flex-shrink-0"
          style={{ border: `1px solid ${s.color}55`, background: `${s.color}10`, color: s.color,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em", fontWeight: 600 }}>
          <StatusIcon size={9} strokeWidth={2} />{s.label}
        </span>
      </div>
    </div>
  );
}

function MessageRow({ msg, lang, onReply }) {
  const t = COPY[lang];
  return (
    <div className="relative w-full p-2.5"
      style={{ background: msg.unread ? "rgba(201,169,97,0.04)" : "rgba(255,255,255,0.01)",
        border: `1px solid ${msg.unread ? HAIRLINE_STRONG : HAIRLINE}`,
        borderLeft: msg.unread ? `2px solid ${AMBER}` : `1px solid ${HAIRLINE}` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <RadioTower size={11} style={{ color: AMBER }} strokeWidth={1.6} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: AMBER, letterSpacing: "0.08em", fontWeight: 600 }}>{msg.from}</span>
          {msg.unread && <span className="px-1 py-0.5"
            style={{ background: AMBER, color: BG, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.08em", fontWeight: 700 }}>{t.msgUnread}</span>}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.08em" }}>{msg.ts}</span>
      </div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "rgba(245,245,244,0.85)", lineHeight: 1.5, marginBottom: 6 }}>{msg.body}</div>
      <button onClick={onReply} className="px-2 py-1"
        style={{ border: `1px solid ${HAIRLINE_STRONG}`, color: AMBER, fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.1em", fontWeight: 600 }}>
        {t.msgReply}
      </button>
    </div>
  );
}

function MetaCell({ label, value, valueColor, bold, mono }) {
  return (
    <div className="px-2 py-1.5" style={{ border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.01)" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: AMBER_DIM, letterSpacing: "0.12em" }}>{label}</div>
      <div style={{ fontFamily: mono ? "'JetBrains Mono', monospace" : "'IBM Plex Sans', sans-serif",
        fontSize: 10.5, color: valueColor || "#F5F5F4", letterSpacing: mono ? "0.06em" : "0",
        marginTop: 1, fontWeight: bold ? 700 : 400 }}>{value}</div>
    </div>
  );
}

function Section({ label, icon: Icon, children }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} style={{ color: AMBER }} strokeWidth={1.6} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.12em" }}>── {label}</span>
      </div>
      <div className="px-3 py-2" style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${HAIRLINE}` }}>{children}</div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, sub, onTap, danger = false }) {
  const accent = danger ? RED : AMBER;
  return (
    <button onClick={onTap} className="relative w-full text-left transition-all duration-100 active:scale-[0.99]"
      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${danger ? "rgba(220,38,38,0.45)" : HAIRLINE_STRONG}`, padding: "12px 12px" }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center" style={{ width: 36, height: 36, border: `1px solid ${accent}`, color: accent }}>
          <Icon size={16} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, color: danger ? "#FCA5A5" : "#F5F5F4", letterSpacing: "0.08em" }}>{label}</div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10.5, color: "rgba(245,245,244,0.5)", marginTop: 2 }}>{sub}</div>
        </div>
        <ChevronRight size={14} style={{ color: accent }} strokeWidth={1.5} />
      </div>
    </button>
  );
}

// =============================================================================
// TURN 3 HELPERS — Structured + Quick Capture + Drone widgets
// =============================================================================
function CategoryCard({ cat, lang, hasTask, prePop, onTap }) {
  const Icon = cat.icon;
  const locked = cat.gated;
  return (
    <button onClick={() => onTap(cat, locked)} className="relative text-left transition-all duration-100 active:scale-[0.98]"
      style={{ background: prePop ? "rgba(201,169,97,0.10)" : (locked ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.02)"),
        border: `1px solid ${prePop ? AMBER : HAIRLINE_STRONG}`, padding: "14px 12px", opacity: locked ? 0.78 : 1, minHeight: 110 }}>
      <CornerBrackets color={AMBER} />
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center justify-center" style={{ width: 36, height: 36, border: `1px solid ${AMBER}`, color: AMBER }}>
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-end gap-1">
          {hasTask && <span className="text-[9px] px-1.5 py-0.5"
            style={{ fontFamily: "'JetBrains Mono', monospace", background: AMBER, color: BG, letterSpacing: "0.08em" }}>◉ TASKED</span>}
          {prePop && <span className="text-[9px] px-1.5 py-0.5"
            style={{ fontFamily: "'JetBrains Mono', monospace", background: AMBER, color: BG, letterSpacing: "0.08em" }}>PRE-POP</span>}
          {locked && <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5"
            style={{ fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${AMBER_DIM}`, color: AMBER_DIM, letterSpacing: "0.08em" }}>
            <Lock size={9} strokeWidth={2} />GATED</span>}
        </div>
      </div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, color: locked ? "#A8A29E" : "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15, marginBottom: 4 }}>{cat.title[lang]}</div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10.5, color: "rgba(245,245,244,0.5)", lineHeight: 1.35 }}>{cat.blurb[lang]}</div>
      <div className="absolute bottom-1.5 right-2"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: AMBER_DIM, letterSpacing: "0.08em" }}>{cat.iaRef.split("·")[0].trim()}</div>
    </button>
  );
}

function CatchallCard({ cat, lang, onTap }) {
  const Icon = cat.icon;
  return (
    <button onClick={() => onTap(cat, false)} className="relative w-full text-left transition-all duration-100 active:scale-[0.99]"
      style={{ background: "rgba(255,255,255,0.015)", border: `1px dashed ${HAIRLINE_STRONG}`, padding: "14px 14px" }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center" style={{ width: 36, height: 36, border: `1px solid ${AMBER}`, color: AMBER }}>
          <Icon size={18} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 13, color: "#F5F5F4", letterSpacing: "0.06em" }}>{cat.title[lang]}</div>
          <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10.5, color: "rgba(245,245,244,0.5)", marginTop: 2 }}>{cat.blurb[lang]}</div>
        </div>
        <ChevronRight size={16} style={{ color: AMBER_DIM }} strokeWidth={1.5} />
      </div>
    </button>
  );
}

function MediaTile({ icon: Icon, label, hint, onTap }) {
  return (
    <button onClick={onTap} className="relative flex flex-col items-center justify-center text-center transition-all duration-100 active:scale-[0.97]"
      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE_STRONG}`, padding: "20px 10px 14px", minHeight: 130 }}>
      <CornerBrackets color={AMBER} />
      <div className="flex items-center justify-center mb-2.5" style={{ width: 52, height: 52, border: `1px solid ${AMBER}`, color: AMBER }}>
        <Icon size={26} strokeWidth={1.3} />
      </div>
      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14, color: "#F5F5F4", letterSpacing: "0.12em" }}>{label}</div>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: "rgba(245,245,244,0.5)", marginTop: 3 }}>{hint}</div>
    </button>
  );
}

function WaveformBars({ active }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(i);
  }, [active]);
  const bars = 36;
  return (
    <div className="flex items-center justify-center gap-[3px] h-20">
      {Array.from({ length: bars }).map((_, i) => {
        const h = active ? 6 + Math.abs(Math.sin((tick + i * 0.7) * 0.4)) * 50 + (i % 4) * 3 : 6;
        return <div key={i} style={{ width: 3, height: h, background: active ? AMBER : AMBER_DIM, transition: "height 100ms ease-out" }} />;
      })}
    </div>
  );
}

function MapPreview({ offset }) {
  return (
    <div className="relative w-full" style={{ height: 180, border: `1px solid ${HAIRLINE_STRONG}`, background: BG,
      backgroundImage: `linear-gradient(rgba(201,169,97,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,97,0.12) 1px, transparent 1px), linear-gradient(rgba(201,169,97,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,97,0.04) 1px, transparent 1px)`,
      backgroundSize: "40px 40px, 40px 40px, 8px 8px, 8px 8px", overflow: "hidden" }}>
      <CornerBrackets color={AMBER} />
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.4 }}>
        <path d="M0,80 Q90,40 180,90 T360,80" fill="none" stroke={AMBER_DIM} strokeWidth="0.7" />
        <path d="M0,110 Q70,70 160,120 T360,105" fill="none" stroke={AMBER_DIM} strokeWidth="0.7" />
        <path d="M0,140 Q100,110 180,150 T360,140" fill="none" stroke={AMBER_DIM} strokeWidth="0.7" />
      </svg>
      <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
        <div style={{ width: 56, height: 56, border: `1px solid ${offset ? ORANGE : RED}`, borderRadius: "50%", opacity: 0.6 }} />
        <Crosshair size={28} color={offset ? ORANGE : RED} strokeWidth={1.5}
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1 flex items-center justify-between"
        style={{ background: "rgba(10,11,13,0.92)", borderTop: `1px solid ${HAIRLINE}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.08em" }}>
        <span style={{ color: AMBER }}>MGRS · 14R PU 64829 53117</span>
        <span style={{ color: offset ? ORANGE : "#FCA5A5" }}>{offset ? "OFFSET ~250m" : "REAL POS"}</span>
      </div>
    </div>
  );
}

function TacticalMap({ height = 200, waypoints = [], showRoute = false, animate = false }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!animate) return;
    const i = setInterval(() => setPulse((p) => (p + 1) % 100), 80);
    return () => clearInterval(i);
  }, [animate]);
  return (
    <div className="relative w-full" style={{ height, border: `1px solid ${HAIRLINE_STRONG}`, background: BG,
      backgroundImage: `linear-gradient(rgba(201,169,97,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,97,0.10) 1px, transparent 1px), linear-gradient(rgba(201,169,97,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,97,0.04) 1px, transparent 1px)`,
      backgroundSize: "40px 40px, 40px 40px, 8px 8px, 8px 8px", overflow: "hidden" }}>
      <CornerBrackets color={AMBER} />
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
        <path d="M0,40 Q90,20 180,50 T360,40" fill="none" stroke={AMBER_DIM} strokeWidth="0.7" />
        <path d="M0,80 Q70,55 160,90 T360,75" fill="none" stroke={AMBER_DIM} strokeWidth="0.7" />
        <path d="M0,120 Q100,90 180,130 T360,120" fill="none" stroke={AMBER_DIM} strokeWidth="0.7" />
        <path d="M0,160 Q120,130 200,170 T360,160" fill="none" stroke={AMBER_DIM} strokeWidth="0.7" />
        <polygon points="220,15 320,25 330,75 240,80" fill="rgba(220,38,38,0.12)" stroke="rgba(220,38,38,0.5)" strokeWidth="1" strokeDasharray="3 3" />
        <text x="248" y="50" fontFamily="JetBrains Mono" fontSize="8" fill="#FCA5A5" letterSpacing="1">NO-FLY</text>
        {showRoute && waypoints.length > 1 && (
          <polyline points={waypoints.map((w) => `${w.x},${w.y}`).join(" ")} fill="none" stroke={AMBER} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.65" />
        )}
      </svg>
      {waypoints.map((w, i) => (
        <div key={i} className="absolute" style={{ left: w.x, top: w.y, transform: "translate(-50%, -50%)" }}>
          <div className="flex items-center justify-center"
            style={{ width: 22, height: 22, borderRadius: "50%", background: BG, border: `1.5px solid ${AMBER}`,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, fontWeight: 600 }}>{i + 1}</div>
        </div>
      ))}
      {animate && waypoints.length > 0 && (
        <div className="absolute" style={{ left: waypoints[1]?.x || waypoints[0].x, top: waypoints[1]?.y || waypoints[0].y, transform: "translate(-50%, -50%)" }}>
          <div style={{ width: 14, height: 14, background: GREEN, borderRadius: "50%",
            opacity: pulse < 50 ? 1 : 0.4, transition: "opacity 0.3s",
            boxShadow: `0 0 0 ${pulse < 50 ? 6 : 2}px rgba(16,185,129,0.25)` }} />
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1 flex items-center justify-between"
        style={{ background: "rgba(10,11,13,0.92)", borderTop: `1px solid ${HAIRLINE}`,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em" }}>
        <span style={{ color: AMBER }}>AO · 14R PU 64xxx 53xxx</span>
        <span style={{ color: AMBER_DIM }}>SCALE · 1:25k</span>
      </div>
    </div>
  );
}

function DroneStatusRow({ icon: Icon, label, value, color = AMBER }) {
  return (
    <div className="flex items-center justify-between px-2.5 py-1.5"
      style={{ border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.01)" }}>
      <div className="flex items-center gap-2">
        <Icon size={12} style={{ color: AMBER_DIM }} strokeWidth={1.5} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.12em" }}>{label}</span>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color, letterSpacing: "0.1em" }}>{value}</span>
    </div>
  );
}

function ChecklistItem({ checked, locked, label, sub, onToggle }) {
  return (
    <button onClick={locked ? undefined : onToggle} disabled={locked}
      className="w-full flex items-start gap-3 px-2.5 py-2 text-left transition-colors"
      style={{ border: `1px solid ${checked ? "rgba(16,185,129,0.4)" : HAIRLINE}`,
        background: checked ? "rgba(16,185,129,0.04)" : "rgba(255,255,255,0.01)",
        cursor: locked ? "default" : "pointer" }}>
      <div className="flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ width: 18, height: 18, border: `1px solid ${checked ? GREEN : AMBER_DIM}`,
          background: checked ? GREEN : "transparent" }}>
        {checked && <CheckCircle2 size={14} color={BG} strokeWidth={2.5} />}
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11.5, color: "#F5F5F4", lineHeight: 1.3 }}>
          {label}
          {locked && <span className="ml-1.5"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: AMBER_DIM, letterSpacing: "0.08em" }}>· AUTO</span>}
        </div>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: "rgba(245,245,244,0.5)", marginTop: 1.5, lineHeight: 1.3 }}>{sub}</div>
      </div>
    </button>
  );
}

function CaptureRow({ type, time, mgrs, t, onTag, onSubmit, onDiscard }) {
  const Icon = type === "video" ? Video : Camera;
  return (
    <div className="relative w-full p-2.5"
      style={{ border: `1px solid ${HAIRLINE_STRONG}`, background: "rgba(255,255,255,0.015)" }}>
      <CornerBrackets color={AMBER} />
      <div className="flex items-start gap-2.5">
        <div className="flex items-center justify-center flex-shrink-0"
          style={{ width: 56, height: 56, border: `1px solid ${HAIRLINE}`, background: "#0d0e10",
            backgroundImage: `linear-gradient(rgba(201,169,97,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,97,0.06) 1px, transparent 1px)`,
            backgroundSize: "8px 8px" }}>
          <Icon size={22} color={AMBER_DIM} strokeWidth={1.3} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 12, color: "#F5F5F4", letterSpacing: "0.08em" }}>{type === "video" ? t.capVideo : t.capPhoto}</span>
            <span className="px-1 py-0.5"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: GREEN,
                border: `1px solid ${GREEN}55`, background: `${GREEN}10`, letterSpacing: "0.08em" }}>{t.captureTagged}</span>
          </div>
          <div className="flex items-center gap-3 mt-1"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.08em" }}>
            <span>{t.capTime}{time}</span><span>· {mgrs}</span>
          </div>
          <div className="flex gap-1.5 mt-2">
            <button onClick={onTag} className="px-2 py-0.5"
              style={{ border: `1px solid ${AMBER}`, color: AMBER, fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.1em", fontWeight: 500 }}>TAG</button>
            <button onClick={onSubmit} className="px-2 py-0.5"
              style={{ border: `1px solid ${HAIRLINE_STRONG}`, color: "#F5F5F4", fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.1em", fontWeight: 500 }}>SUBMIT</button>
            <button onClick={onDiscard} className="px-2 py-0.5"
              style={{ border: `1px solid rgba(220,38,38,0.4)`, color: "#FCA5A5", fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.1em", fontWeight: 500 }}>DISCARD</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ label, icon: Icon, ok = false, mono = false }) {
  const color = ok ? GREEN : mono ? AMBER : ORANGE;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5"
      style={{ border: `1px solid ${color}55`, background: `${color}10`,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: color, letterSpacing: "0.06em" }}>
      <Icon size={9} strokeWidth={1.8} />{label}
    </span>
  );
}

// =============================================================================
// WIZARD HELPERS — for PERSON > New person seen
// =============================================================================
function ProgressDots({ step, total, t }) {
  return (
    <div className="flex items-center gap-2 px-4">
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.12em", fontWeight: 600 }}>
        {t.stepOf} {step} {t.of} {total}
      </span>
      <div className="flex-1 flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const n = i + 1;
          const done = n < step;
          const cur = n === step;
          return (
            <div key={i} className="flex-1" style={{ height: 3,
              background: done ? AMBER : cur ? AMBER : "rgba(201,169,97,0.18)",
              opacity: cur ? 1 : done ? 0.7 : 1 }} />
          );
        })}
      </div>
    </div>
  );
}

function VoicePrompt({ t, onTap }) {
  return (
    <button onClick={onTap} className="w-full mt-2 flex items-center gap-2 px-3 py-2 transition-all"
      style={{ border: `1px dashed ${HAIRLINE_STRONG}`, background: "rgba(201,169,97,0.04)" }}>
      <Mic size={13} style={{ color: AMBER }} strokeWidth={1.5} />
      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.7)" }}>
        {t.voicePrompt}
      </span>
    </button>
  );
}

function ChipRow({ label, options, value, onChange, lang, sub }) {
  return (
    <div className="mb-3.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em" }}>── {label}</span>
        {sub && <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: AMBER_DIM }}>{sub}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = value === opt.key;
          return (
            <button key={opt.key} onClick={() => onChange(opt.key === value ? null : opt.key)}
              className="px-2.5 py-1.5 transition-all flex items-center gap-1.5"
              style={{ background: active ? AMBER : "transparent", color: active ? BG : AMBER,
                border: `1px solid ${active ? AMBER : HAIRLINE_STRONG}`,
                fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>
              {Icon && <Icon size={11} strokeWidth={1.8} />}
              {opt[lang]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WizardTextField({ label, value, onChange, placeholder, multiline = false }) {
  return (
    <div className="mb-3.5">
      <div className="mb-1.5">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em" }}>── {label}</span>
      </div>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full px-2.5 py-2 outline-none"
          style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE_STRONG}`,
            fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "#F5F5F4", lineHeight: 1.5, resize: "none" }} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-2.5 py-1.5 outline-none"
          style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE_STRONG}`,
            fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "#F5F5F4" }} />
      )}
    </div>
  );
}

function LocationMapMini({ offset }) {
  return (
    <div className="relative w-full" style={{ height: 130, border: `1px solid ${HAIRLINE_STRONG}`, background: BG,
      backgroundImage: `linear-gradient(rgba(201,169,97,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,97,0.10) 1px, transparent 1px), linear-gradient(rgba(201,169,97,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,97,0.04) 1px, transparent 1px)`,
      backgroundSize: "40px 40px, 40px 40px, 8px 8px, 8px 8px", overflow: "hidden" }}>
      <CornerBrackets color={AMBER} />
      <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.4 }}>
        <path d="M0,60 Q90,30 180,70 T360,60" fill="none" stroke={AMBER_DIM} strokeWidth="0.7" />
        <path d="M0,90 Q70,60 160,100 T360,85" fill="none" stroke={AMBER_DIM} strokeWidth="0.7" />
      </svg>
      <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
        <div style={{ width: 48, height: 48, border: `1px solid ${offset ? ORANGE : RED}`, borderRadius: "50%", opacity: 0.6 }} />
        <Crosshair size={24} color={offset ? ORANGE : RED} strokeWidth={1.5}
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1 flex items-center justify-between"
        style={{ background: "rgba(10,11,13,0.92)", borderTop: `1px solid ${HAIRLINE}`,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em" }}>
        <span style={{ color: AMBER }}>14R PU 64829 53117</span>
        <span style={{ color: offset ? ORANGE : "#FCA5A5" }}>{offset ? "OFFSET ~250m" : "REAL POS"}</span>
      </div>
    </div>
  );
}

function AttachedMedia({ icon: Icon, label, id, dur, onRemove, t }) {
  return (
    <div className="relative w-full p-2.5 flex items-center gap-2.5"
      style={{ border: `1px solid rgba(16,185,129,0.4)`, background: "rgba(16,185,129,0.05)" }}>
      <div className="flex items-center justify-center flex-shrink-0"
        style={{ width: 40, height: 40, border: `1px solid ${GREEN}`, color: GREEN }}>
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={11} style={{ color: GREEN }} strokeWidth={2} />
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 12, color: GREEN, letterSpacing: "0.08em" }}>
            {label}
          </span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.06em", marginTop: 2 }}>
          {id}{dur ? ` · ${dur}` : ""} · EXIF stripped · location offset on
        </div>
      </div>
      <button onClick={onRemove} className="px-2 py-1 flex-shrink-0"
        style={{ border: `1px solid rgba(220,38,38,0.4)`, color: "#FCA5A5",
          fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.1em", fontWeight: 500 }}>
        {t.wzPhotoRemove}
      </button>
    </div>
  );
}

function EmptyMediaSlot({ icon: Icon, label, hint, onTap }) {
  return (
    <button onClick={onTap}
      className="relative w-full p-3 flex items-center gap-3 transition-all duration-100 active:scale-[0.99]"
      style={{ border: `1px dashed ${HAIRLINE_STRONG}`, background: "rgba(255,255,255,0.015)" }}>
      <div className="flex items-center justify-center flex-shrink-0"
        style={{ width: 40, height: 40, border: `1px solid ${AMBER_DIM}`, color: AMBER_DIM }}>
        <Icon size={18} strokeWidth={1.5} />
      </div>
      <div className="flex-1 text-left">
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 12, color: "#F5F5F4", letterSpacing: "0.08em" }}>
          {label}
        </div>
        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10.5, color: "rgba(245,245,244,0.5)", marginTop: 2 }}>
          {hint}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: AMBER_DIM }} strokeWidth={1.5} />
    </button>
  );
}

function SummaryRow({ label, value, t }) {
  const empty = !value || value === "";
  return (
    <div className="flex items-start gap-3 py-1.5" style={{ borderBottom: `1px solid ${HAIRLINE}` }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em", minWidth: 56, flexShrink: 0, marginTop: 2 }}>
        {label}
      </span>
      <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12,
        color: empty ? "rgba(245,245,244,0.4)" : "#F5F5F4", lineHeight: 1.45, fontStyle: empty ? "italic" : "normal" }}>
        {empty ? t.summaryEmpty : value}
      </span>
    </div>
  );
}

// =============================================================================
// MAIN APP
// =============================================================================
export default function ArsPocIntegrated() {
  const [lang, setLang] = useState("en");
  const [route, setRoute] = useState({ screen: "auth", history: [], params: {} });
  const [syncQueue, setSyncQueue] = useState(2);

  // Auth state (POC demo only — production uses device pairing + Secure Enclave)
  const [authCallsign, setAuthCallsign] = useState("");
  const [authPasscode, setAuthPasscode] = useState("");
  const [authBiometricUnlocking, setAuthBiometricUnlocking] = useState(false);

  // Session (set on successful demo login)
  const [session, setSession] = useState(null); // { source_id, pseudonym, handler_callsign, aor }

  // Live data from Supabase
  const [liveTaskings, setLiveTaskings] = useState([]);
  const [liveReports, setLiveReports] = useState([]);

  // Lifted state for screens (will be used in Turns 2-3)
  const [tab, setTab] = useState("active");
  const [selectedTask, setSelectedTask] = useState(null);
  const [concernOpen, setConcernOpen] = useState(false);
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [gatedOpen, setGatedOpen] = useState(false);
  const [qcMediaType, setQcMediaType] = useState(null);
  const [recDuration, setRecDuration] = useState(0);
  const [photoFlash, setPhotoFlash] = useState(false);
  const [submitOk, setSubmitOk] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [geoOffset, setGeoOffset] = useState(true);
  const [missionName, setMissionName] = useState("");
  const [checkOpsec, setCheckOpsec] = useState(false);
  const [checkNofly, setCheckNofly] = useState(false);
  const [authState, setAuthState] = useState("pending");
  const [flightElapsed, setFlightElapsed] = useState(0);
  const [battery, setBattery] = useState(87);
  const [captures, setCaptures] = useState([]);
  const [missionStatus, setMissionStatus] = useState("complete");
  const [abortOpen, setAbortOpen] = useState(false);

  // Wizard state — for PERSON > New person seen
  const [wzStep, setWzStep] = useState(1);
  const [wzSex, setWzSex] = useState(null);
  const [wzAge, setWzAge] = useState(null);
  const [wzBuild, setWzBuild] = useState(null);
  const [wzFeatures, setWzFeatures] = useState("");
  const [wzNamedPlace, setWzNamedPlace] = useState("");
  const [wzTime, setWzTime] = useState(null);
  const [wzActivity, setWzActivity] = useState("");
  const [wzOffset, setWzOffset] = useState(true);
  const [wzPhotoAttached, setWzPhotoAttached] = useState(null);
  const [wzVoiceAttached, setWzVoiceAttached] = useState(null);
  const [wzPhotoFlash, setWzPhotoFlash] = useState(false);
  const [wzVoiceRecording, setWzVoiceRecording] = useState(false);
  const [wzBasis, setWzBasis] = useState("direct");
  const [wzConfidence, setWzConfidence] = useState(null);
  const [wzIsSubmitting, setWzIsSubmitting] = useState(false);

  const [now, setNow] = useState(new Date());
  const [pulse, setPulse] = useState(false);
  const [toast, setToast] = useState(null);

  const t = COPY[lang];

  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { const i = setInterval(() => setPulse((p) => !p), 1400); return () => clearInterval(i); }, []);
  useEffect(() => { if (!toast) return; const tm = setTimeout(() => setToast(null), 2600); return () => clearTimeout(tm); }, [toast]);

  // Recording timer (video/audio)
  useEffect(() => {
    if (route.screen !== "qcVideoRec" && route.screen !== "qcAudioRec") { setRecDuration(0); return; }
    const i = setInterval(() => setRecDuration((d) => d + 1), 1000);
    return () => clearInterval(i);
  }, [route.screen]);

  // Live flight timer + battery drain
  useEffect(() => {
    if (route.screen !== "liveFlight") return;
    const i = setInterval(() => {
      setFlightElapsed((d) => d + 1);
      setBattery((b) => Math.max(b - (Math.random() < 0.4 ? 1 : 0), 50));
    }, 1000);
    return () => clearInterval(i);
  }, [route.screen]);

  // Submit OK auto-return — handles both Quick Capture and Wizard submissions
  useEffect(() => {
    if (!submitOk) return;
    const tm = setTimeout(() => {
      setSubmitOk(false);
      setQcMediaType(null);
      // Wizard cleanup (no-op if wizard wasn't active)
      setWzStep(1);
      setWzSex(null); setWzAge(null); setWzBuild(null); setWzFeatures("");
      setWzNamedPlace(""); setWzTime(null); setWzActivity("");
      setWzPhotoAttached(null); setWzVoiceAttached(null);
      setWzBasis("direct"); setWzConfidence(null);
      setRoute({ screen: "home", history: [], params: {} });
    }, 1600);
    return () => clearTimeout(tm);
  }, [submitOk]);

  // Pre-pop: when arriving at structured with preSelectedCategory, auto-open the modal
  useEffect(() => {
    if (route.screen === "structured" && route.params.preSelectedCategory) {
      const cat = CATEGORIES.find(c => c.key === route.params.preSelectedCategory);
      if (cat) setActiveSubCat(cat);
    }
    if (route.screen !== "structured") setActiveSubCat(null);
  }, [route.screen, route.params.preSelectedCategory]);

  const clock = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const recClock = `${String(Math.floor(recDuration / 60)).padStart(2, "0")}:${String(recDuration % 60).padStart(2, "0")}`;
  const flightClock = `${String(Math.floor(flightElapsed / 60)).padStart(2, "0")}:${String(flightElapsed % 60).padStart(2, "0")}`;

  const navigate = (screen, params = {}) => setRoute(prev => ({ screen, history: [...prev.history, prev.screen], params }));
  // Like navigate but does NOT push current screen onto history — used for transitions where the previous screen
  // should be skipped on back (e.g., recording → review, abort → postMission).
  const replaceRoute = (screen, params = {}) => setRoute(prev => ({ screen, history: prev.history, params }));
  const goBack = () => {
    if (route.screen === "liveFlight") { setAbortOpen(true); return; }
    if (route.screen === "wizardNewPerson" && wzStep > 1) { setWzStep((s) => s - 1); return; }
    if (route.history.length === 0) return;
    const last = route.history[route.history.length - 1];
    setRoute({ screen: last, history: route.history.slice(0, -1), params: {} });
  };

  // Auth handlers (POC demo — accepts any non-empty callsign + passcode)
  const authCanLogin = authCallsign.trim().length > 0;
  const doDemoLogin = async () => {
    const pseudo = authCallsign.trim().toUpperCase();
    if (!pseudo) return;
    const { data, error } = await supabase.rpc("mobile_demo_login", { p_pseudonym: pseudo });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) {
      setToast("Unknown callsign — try S-7421, S-3892, S-1156, or S-4407");
      return;
    }
    setSession({
      source_id: row.source_id,
      pseudonym: row.pseudonym,
      handler_callsign: row.handler_callsign,
      aor: row.aor,
    });
    setRoute({ screen: "home", history: [], params: {} });
  };
  const handleLogin = () => { if (authCanLogin) doDemoLogin(); };
  const handleBiometricLogin = () => {
    if (!authCallsign.trim()) {
      setToast("Enter a callsign first");
      return;
    }
    setAuthBiometricUnlocking(true);
    setTimeout(async () => {
      setAuthBiometricUnlocking(false);
      await doDemoLogin();
    }, 800);
  };
  const handleLogout = () => {
    setAuthCallsign("");
    setAuthPasscode("");
    setSession(null);
    setLiveTaskings([]);
    setLiveReports([]);
    setRoute({ screen: "auth", history: [], params: {} });
  };

  // Display values (fall back to constants for the auth screen / pre-login)
  const sessionPseudonym = session?.pseudonym ?? "—";
  const sessionHandler = session?.handler_callsign ?? "—";

  // Map DB rows → existing TaskRow shape
  const mapTasking = (r) => {
    const priorityMap = { time_sensitive: "time-sensitive", priority: "priority", routine: "routine" };
    let deadlineMinutes = null;
    if (r.due_at) {
      const diffMs = new Date(r.due_at).getTime() - Date.now();
      deadlineMinutes = Math.max(0, Math.round(diffMs / 60000));
    }
    return {
      _dbId: r.id,
      id: r.task_id_display || r.id,
      title: r.title,
      priority: priorityMap[r.priority] || "routine",
      pir: r.pir || "—",
      deadlineMinutes,
      fresh: !!r.is_new,
      // task-detail extras (best-effort fallbacks so the existing screen still renders)
      target: r.target || r.title,
      guidance: Array.isArray(r.guidance) ? r.guidance : (r.guidance ? [r.guidance] : []),
      constraint: r.constraint || "Observation only",
      legalReview: r.legal_review || "—",
      issuedAt: r.created_at ? relTime(r.created_at) : "—",
      category: r.category || "person",
      subCategory: r.sub_category || "",
    };
  };

  const mapReport = (r) => {
    const sub = r.sub_category ? ` · ${String(r.sub_category).replace(/_/g, " ").toUpperCase()}` : "";
    return {
      _dbId: r.id,
      id: r.report_id_display || r.id,
      title: `${String(r.category || "").toUpperCase()}${sub}`,
      submittedAt: r.submitted_at ? relTime(r.submitted_at) : "—",
      status: r.validation_status || "pending_validation",
    };
  };

  // CompletedRow expects "validated" | "pending" | "rejected" | "on_hold"
  const dbStatusToUi = (s) => (s === "pending_validation" ? "pending" : s);

  // Fetcher
  const fetchLive = async () => {
    if (!session?.source_id) return;
    const [{ data: tk }, { data: rp }] = await Promise.all([
      supabase.from("taskings").select("*").eq("source_id", session.source_id).eq("status", "active").order("created_at", { ascending: false }),
      supabase.from("reports").select("id, report_id_display, category, sub_category, validation_status, submitted_at, source_id, handler_id").eq("source_id", session.source_id).order("submitted_at", { ascending: false }),
    ]);
    setLiveTaskings((tk || []).map(mapTasking));
    setLiveReports((rp || []).map((r) => ({ ...mapReport(r), status: dbStatusToUi(r.validation_status) })));
    if (import.meta.env.DEV) {
      try {
        // eslint-disable-next-line no-console
        console.log("[reports query]", new Date().toLocaleTimeString(), "fetched", rp?.length || 0, "report(s), full first row:", rp?.[0]);
      } catch {}
    }
  };

  // Initial + 5s polling while logged in
  useEffect(() => {
    if (!session) return;
    fetchLive();
    const i = setInterval(fetchLive, 5000);
    const onFocus = () => fetchLive();
    const onVis = () => { if (document.visibilityState === "visible") fetchLive(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(i);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.source_id]);

  // Refetch immediately when user switches into the DONE tab
  useEffect(() => {
    if (!session?.source_id) return;
    if (tab === "completed") fetchLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, session?.source_id]);

  // Mark a tasking as no-longer-new when its detail is opened
  const markTaskingSeen = async (dbId) => {
    if (!dbId) return;
    setLiveTaskings((arr) => arr.map((x) => (x._dbId === dbId ? { ...x, fresh: false } : x)));
    await supabase.from("taskings").update({ is_new: false }).eq("id", dbId);
  };

  // Quick Capture handlers
  const tapPhoto = () => {
    setPhotoFlash(true);
    setTimeout(() => setPhotoFlash(false), 220);
    setTimeout(() => { setQcMediaType("photo"); navigate("qcReview"); }, 260);
  };
  const tapVideo = () => { setQcMediaType("video"); navigate("qcVideoRec"); };
  const tapAudio = () => { setQcMediaType("audio"); navigate("qcAudioRec"); };
  const tapGeo = () => { setQcMediaType("geo"); navigate("qcReview"); };
  const stopRecording = () => replaceRoute("qcReview");
  const submitRaw = () => { setSyncQueue(q => q + 1); setSubmitOk(true); };

  // Structured handlers
  const handleCardTap = (cat, locked) => {
    if (locked) setGatedOpen(true);
    else if (cat.key !== "person") setToast("Category coming in v0.3 — try Person for the demo");
    else setActiveSubCat(cat);
  };
  const handlePickSub = (catKey, subKey) => {
    setActiveSubCat(null);
    if (catKey === "person" && subKey === "new-person") {
      // Reset wizard fresh and launch
      setWzStep(1);
      setWzSex(null); setWzAge(null); setWzBuild(null); setWzFeatures("");
      setWzNamedPlace(""); setWzTime(null); setWzActivity(""); setWzOffset(true);
      setWzPhotoAttached(null); setWzVoiceAttached(null);
      setWzBasis("direct"); setWzConfidence(null);
      navigate("wizardNewPerson");
      return;
    }
    if (catKey !== "person") {
      setToast("Category coming in v0.3 — try Person for the demo");
      return;
    }
    setToast(`${t.toastFutureScreen}: wizard for ${catKey}/${subKey}`);
  };

  // Wizard handlers
  const wzNext = () => setWzStep((s) => Math.min(s + 1, 4));
  const wzPrev = () => {
    if (wzStep > 1) setWzStep((s) => s - 1);
    else goBack();
  };
  // Ensure basis_of_knowledge always has the default value when entering Step 4
  useEffect(() => {
    if (wzStep === 4 && !wzBasis) setWzBasis("direct");
  }, [wzStep, wzBasis]);
  const wzTapPhoto = () => {
    setWzPhotoFlash(true);
    setTimeout(() => setWzPhotoFlash(false), 220);
    setTimeout(() => setWzPhotoAttached("IMG_S7421_NPS_001"), 260);
  };
  const wzTapVoice = () => {
    setWzVoiceRecording(true);
    setTimeout(() => { setWzVoiceRecording(false); setWzVoiceAttached("0:18"); }, 1800);
  };
  const wzCanSubmit = !!wzConfidence;
  const wzSubmit = async () => {
    if (!wzCanSubmit) return;
    if (!wzBasis || !wzConfidence) {
      setToast("Please choose how you know this and your confidence level.");
      return;
    }
    if (wzIsSubmitting) return;
    setWzIsSubmitting(true);
    try {
      const basisMap = { direct: "saw_self", hearsay: "someone_told_me", doc: "read_written" };
      const mappedBasis = basisMap[wzBasis];
      if (!mappedBasis) {
        console.error("[wzSubmit] basis mapping failed", { wzBasis, basisMap });
        setToast("Internal error: unrecognized basis selection.");
        return;
      }
      if (!["low", "med", "high"].includes(wzConfidence)) {
        console.error("[wzSubmit] confidence mapping failed", { wzConfidence });
        setToast("Internal error: unrecognized confidence selection.");
        return;
      }
      const sexMap = { m: "male", f: "female", u: "unsure" };
      const ageMap = { teens: "teens", "20s": "20s", "30s": "30s", "40s": "40s", "50s": "50s", "60p": "60+", u: "unsure" };
      const buildMap = { slim: "slim", avg: "average", heavy: "heavy", u: "unsure" };
      const timeMap = { now: "just_now", hour: "within_hour", today: "earlier_today", yest: "yesterday", week: "earlier_this_week", custom: "other" };
      const { data, error } = await supabase.rpc("submit_report", {
        p_source_pseudonym: sessionPseudonym,
        p_category: "person",
        p_sub_category: "new_person_seen",
        p_person_sex: sexMap[wzSex],
        p_person_age: ageMap[wzAge],
        p_person_build: buildMap[wzBuild],
        p_person_features: wzFeatures || null,
        p_mgrs: "14R PU 64829 53117",
        p_named_place: wzNamedPlace || null,
        p_when_observed: timeMap[wzTime],
        p_activity: wzActivity || null,
        p_has_photo: !!wzPhotoAttached,
        p_has_voice: !!wzVoiceAttached,
        p_basis_of_knowledge: mappedBasis,
        p_confidence: wzConfidence,
      });
      console.log("[submit_report] data:", data);
      console.log("[submit_report] error:", error);
      if (error) {
        setToast(`Submit failed: ${error.message}`);
        return;
      }
      if (!data) {
        setToast("Submit failed: no data returned");
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      const rid = row?.report_id_display || "RPT";
      setToast(`Report submitted · ${rid}`);
      fetchLive();
      setSubmitOk(true);
    } catch (e) {
      setToast(`Submit failed: ${e instanceof Error ? e.message : "unknown error"}`);
    } finally {
      setWzIsSubmitting(false);
    }
  };

  // Drone handlers
  const checkBattery = battery > 80;
  const checkGps = true;
  const allChecksDone = checkOpsec && checkNofly && checkBattery && checkGps;
  const canLaunch = allChecksDone && authState === "approved";
  const requestAuth = () => {
    setAuthState("requested");
    setTimeout(() => setAuthState("approved"), 1800);
  };
  const launchMission = () => {
    if (!canLaunch) return;
    setFlightElapsed(0); setBattery(87); setCaptures([]);
    navigate("liveFlight");
  };
  const captureMedia = (kind) => {
    const time = `${String(Math.floor(flightElapsed / 60)).padStart(2, "0")}:${String(flightElapsed % 60).padStart(2, "0")}`;
    const mgrs = `14R PU 648${(29 + captures.length).toString().padStart(2, "0")} 5311${(7 + captures.length) % 10}`;
    setCaptures((c) => [...c, { type: kind, time, mgrs }]);
    setToast(t.toastTagged);
  };
  const completeMission = () => {
    setMissionStatus("complete");
    // Drop preMission AND skip pushing liveFlight — back from postMission goes to droneLanding.
    setRoute(prev => ({ screen: "postMission", history: prev.history.slice(0, -1), params: {} }));
  };
  // Reset all mission state and start fresh — used by "NEW MISSION" on droneLanding so leftover state from
  // a previous aborted/completed mission doesn't bleed into the next plan.
  const startNewMission = () => {
    setCheckOpsec(false); setCheckNofly(false); setAuthState("pending");
    setMissionName(""); setCaptures([]); setBattery(87); setFlightElapsed(0); setMissionStatus("complete");
    navigate("preMission");
  };
  const submitMissionReport = () => {
    setSyncQueue(q => q + 1 + captures.length);
    setToast(t.toastSubmitted);
    setTimeout(() => {
      setRoute({ screen: "home", history: [], params: {} });
      setCheckOpsec(false); setCheckNofly(false); setAuthState("pending");
      setMissionName(""); setCaptures([]); setBattery(87);
    }, 1700);
  };

  const waypoints = [{ x: 80, y: 130 }, { x: 175, y: 95 }, { x: 270, y: 130 }];

  const breadcrumbMap = {
    auth: t.authBreadcrumb,
    home: session?.pseudonym ? `${t.homeBreadcrumb} · ${session.pseudonym}` : t.homeBreadcrumb,
    modeChooser: t.modeBreadcrumb,
    myInstructions: t.instructionsBreadcrumb, taskDetail: t.taskBreadcrumb,
    qcPicker: t.qcBreadcrumb, qcVideoRec: t.qcBreadcrumb, qcAudioRec: t.qcBreadcrumb, qcReview: t.qcBreadcrumb,
    structured: t.structuredBreadcrumb,
    droneLanding: t.droneBreadcrumb, preMission: t.preMissionBreadcrumb,
    liveFlight: t.flightBreadcrumb, postMission: t.reviewBreadcrumb,
    drafts: t.draftsBreadcrumb, secure: t.secureBreadcrumb,
    wizardNewPerson: t.wizardBreadcrumb,
  };
  let breadcrumb = breadcrumbMap[route.screen] || "";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-6"
      style={{ background: "#FFFFFF", backgroundImage: "linear-gradient(rgba(138,115,64,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(138,115,64,0.06) 1px, transparent 1px)", backgroundSize: "32px 32px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeOut { from { opacity: 0.85; } to { opacity: 0; } }
      `}</style>

      <div className="w-full text-center py-2 px-4 mb-4"
        style={{ background: "rgba(220,38,38,0.06)", borderTop: "1px solid rgba(220,38,38,0.5)", borderBottom: "1px solid rgba(220,38,38,0.5)",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.1em", color: "#991B1B" }}>
        {t.classification}
      </div>

      <div className="text-center mb-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER_DIM, letterSpacing: "0.18em" }}>
        HARS POC · INTEGRATED · ALL FLOWS WIRED
      </div>

      <div className="relative" style={{ width: 390, height: 800, background: BG, border: `1px solid ${HAIRLINE_STRONG}`,
        borderRadius: 38, padding: 6, boxShadow: "0 0 0 1px rgba(201,169,97,0.12), 0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden" }}>
        <div className="relative w-full h-full overflow-hidden" style={{ background: BG, borderRadius: 32 }}>

          {/* Dynamic island */}
          <div className="absolute left-1/2 -translate-x-1/2 z-30" style={{ top: 8, width: 110, height: 28, background: "#000", borderRadius: 18 }} />

          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1 z-20 relative"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#F5F5F4" }}>
            <span style={{ letterSpacing: "0.05em" }}>{clock}</span>
            <span style={{ width: 110 }}></span>
            <span style={{ display: "flex", gap: 4, alignItems: "center", letterSpacing: "0.05em", fontSize: 11 }}>
              <span>5G</span>
              <span style={{ display: "inline-block", width: 22, height: 11, border: "1px solid #F5F5F4", borderRadius: 2, position: "relative" }}>
                <span style={{ position: "absolute", inset: 1, background: "#F5F5F4", width: "70%" }} />
              </span>
            </span>
          </div>

          {/* Demo classification (omitted on home for the cleaner branded look) */}
          {route.screen !== "home" && (
            <div className="text-center py-1 mx-3 mt-2"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: "#FCA5A5", border: "1px solid rgba(220,38,38,0.35)" }}>
              {t.demoLine}
            </div>
          )}

          {/* Top nav */}
          {route.screen === "home" || route.screen === "auth" ? (
            <div className="px-4 mt-3 flex items-center justify-between">
              <div style={{ width: 78 }} />
              <div className="text-right">
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.12em" }}>{breadcrumb}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.12em", marginTop: 2 }}>{route.screen === "auth" ? "—" : t.homeGreeting}</div>
              </div>
            </div>
          ) : (
            <div className="px-4 mt-3 flex items-center justify-between">
              <button onClick={goBack} className="flex items-center gap-1.5 transition-all active:scale-95"
                style={{ border: `1px solid ${HAIRLINE_STRONG}`, padding: "6px 8px", color: AMBER, background: "rgba(255,255,255,0.015)" }}>
                <ChevronLeft size={14} strokeWidth={1.5} />
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 10, letterSpacing: "0.12em", fontWeight: 600 }}>{t.backLabel}</span>
              </button>
              <div className="text-right">
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.12em" }}>{breadcrumb}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.12em", marginTop: 2 }}>{t.sourceLabel} · {sessionPseudonym}</div>
              </div>
            </div>
          )}

          {/* === AUTH (POC demo login) === */}
          {route.screen === "auth" && (
            <div className="px-4 mt-3 pb-12 flex flex-col" style={{ minHeight: 600 }}>
              {/* Branding */}
              <div className="text-center mt-6 mb-1">
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 42, letterSpacing: "0.22em", color: AMBER, lineHeight: 1 }}>{t.authTitle}</div>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", letterSpacing: "0.1em", marginTop: 6 }}>{t.authSub}</div>
              </div>

              <div className="mt-8 flex-1">
                {/* Callsign field */}
                <div className="mb-3">
                  <div className="mb-1.5">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em" }}>── {t.authCallsignLabel}</span>
                  </div>
                  <input value={authCallsign} onChange={(e) => setAuthCallsign(e.target.value)}
                    placeholder={t.authCallsignPlaceholder} autoCapitalize="characters"
                    className="w-full px-3 py-2.5 outline-none"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE_STRONG}`,
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#F5F5F4", letterSpacing: "0.08em" }} />
                </div>

                {/* Passcode field */}
                <div className="mb-4">
                  <div className="mb-1.5">
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em" }}>── {t.authPasscodeLabel}</span>
                  </div>
                  <input type="password" value={authPasscode} onChange={(e) => setAuthPasscode(e.target.value)}
                    placeholder={t.authPasscodePlaceholder}
                    className="w-full px-3 py-2.5 outline-none"
                    style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${HAIRLINE_STRONG}`,
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#F5F5F4", letterSpacing: "0.16em" }} />
                </div>

                {/* Login button */}
                <button onClick={handleLogin} disabled={!authCanLogin}
                  className="w-full py-3 transition-all"
                  style={{ background: authCanLogin ? AMBER : "transparent",
                    color: authCanLogin ? BG : AMBER_DIM,
                    border: `1px solid ${authCanLogin ? AMBER : HAIRLINE}`,
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.16em",
                    cursor: authCanLogin ? "pointer" : "not-allowed" }}>
                  {t.authLoginButton}
                </button>
                {!authCanLogin && (
                  <div className="text-center mt-1.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, color: AMBER_DIM, letterSpacing: "0.08em" }}>
                    {t.authLoginBlocked}
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1" style={{ height: 1, background: HAIRLINE }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.18em" }}>{t.authDividerOr}</span>
                  <div className="flex-1" style={{ height: 1, background: HAIRLINE }} />
                </div>

                {/* Biometric button */}
                <button onClick={handleBiometricLogin} disabled={authBiometricUnlocking}
                  className="w-full flex flex-col items-center justify-center py-4 transition-all"
                  style={{ background: "rgba(255,255,255,0.015)", border: `1px solid ${HAIRLINE_STRONG}`,
                    cursor: authBiometricUnlocking ? "wait" : "pointer" }}>
                  <div className="flex items-center justify-center mb-1.5"
                    style={{ width: 44, height: 44, borderRadius: 22, border: `1px solid ${authBiometricUnlocking ? GREEN : AMBER}`, color: authBiometricUnlocking ? GREEN : AMBER }}>
                    <User size={22} strokeWidth={1.5} />
                  </div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 12, color: authBiometricUnlocking ? GREEN : "#F5F5F4", letterSpacing: "0.14em" }}>
                    {authBiometricUnlocking ? t.authBiometricUnlocking : t.authBiometricLabel}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: "rgba(245,245,244,0.5)", marginTop: 2 }}>
                    {t.authBiometricHint}
                  </div>
                </button>
              </div>

              {/* Demo banner pinned to bottom of form area */}
              <div className="px-2.5 py-2 mt-6 mb-4 text-center"
                style={{ border: `1px dashed ${HAIRLINE}`, background: "rgba(245,158,11,0.03)",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: ORANGE, letterSpacing: "0.08em", lineHeight: 1.5 }}>
                {t.authDemoBanner}
              </div>
            </div>
          )}

          {/* === HOME === */}
          {route.screen === "home" && (
            <>
              <div className="px-4 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "0.18em", color: AMBER, lineHeight: 1 }}>{t.arsTitle}</div>
                    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: "rgba(245,245,244,0.5)", letterSpacing: "0.08em", marginTop: 2 }}>{t.arsSub}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: AMBER, letterSpacing: "0.1em" }}>{t.sourceLabel} · {sessionPseudonym}</div>
                  </div>
                </div>
                <div className="my-3" style={{ height: 1, background: HAIRLINE }} />
              </div>
              <div className="px-4 mb-3"><SyncBanner queueCount={syncQueue} t={t} /></div>
              <div className="px-4 space-y-2.5">
                <HomeCard icon={ClipboardList} title={t.homeInstructions} sub={t.homeInstructionsSub}
                  badge={liveTaskings.filter((x) => x.fresh).length > 0 ? `${liveTaskings.filter((x) => x.fresh).length} NEW` : null}
                  onTap={() => navigate("myInstructions")} />
                <HomeCard icon={Send} title={t.homeCollect} sub={t.homeCollectSub} onTap={() => navigate("modeChooser")} />
                <HomeCard icon={FolderClock} title={t.homeDrafts} sub={t.homeDraftsSub} badge={`${syncQueue} QUEUED`} onTap={() => navigate("drafts")} />
                <HomeCard icon={ShieldAlert} title={t.homeSecure} sub={t.homeSecureSub} onTap={() => navigate("secure")} danger />
              </div>
            </>
          )}

          {/* === MODE CHOOSER === */}
          {route.screen === "modeChooser" && (
            <>
              <div className="px-4 mt-3">
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.modeTitle}</div>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.modeSubtitle}</div>
              </div>
              <div className="px-4 mt-2.5"><SyncBanner queueCount={syncQueue} t={t} /></div>
              <div className="px-4 mt-4 space-y-2.5">
                <ModeCard icon={Camera} title={t.modeQuick} sub={t.modeQuickSub} hint={t.modeQuickHint} onTap={() => navigate("qcPicker")} />
                <ModeCard icon={PenLine} title={t.modeStructured} sub={t.modeStructuredSub} hint={t.modeStructuredHint} onTap={() => navigate("structured")} />
                <ModeCard icon={Plane} title={t.modeDrone} sub={t.modeDroneSub} hint={t.modeDroneHint} onTap={() => navigate("droneLanding")} />
              </div>
            </>
          )}

          {/* === MY INSTRUCTIONS === */}
          {route.screen === "myInstructions" && (
            <>
              <div className="px-4 mt-3">
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.miTitle}</div>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.miSub}</div>
              </div>
              <div className="mt-3">
                <TabBar tab={tab} setTab={setTab} t={t}
                  activeCount={liveTaskings.length}
                  msgCount={MESSAGES.filter(m => m.unread).length} />
              </div>
              <div className="px-4 mt-3 pb-12 overflow-y-auto" style={{ maxHeight: 560 }}>
                {tab === "active" && (
                  <div className="space-y-2">
                    {liveTaskings.length === 0 && (
                      <div className="px-3 py-6 text-center" style={{ border: `1px dashed ${HAIRLINE}`, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: AMBER_DIM }}>
                        No active taskings.
                      </div>
                    )}
                    {liveTaskings.map((task) => (
                      <TaskRow key={task._dbId || task.id} task={task} lang={lang}
                        onTap={() => { setSelectedTask(task); markTaskingSeen(task._dbId); navigate("taskDetail"); }} />
                    ))}
                  </div>
                )}
                {tab === "standing" && (
                  <div className="space-y-2">{STANDING.map((sr) => <StandingRow key={sr.id} sr={sr} lang={lang} />)}</div>
                )}
                {tab === "completed" && (
                  <div className="space-y-2">
                    {liveReports.length === 0 && (
                      <div className="px-3 py-6 text-center" style={{ border: `1px dashed ${HAIRLINE}`, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: AMBER_DIM }}>
                        No submitted reports yet.
                      </div>
                    )}
                    {liveReports.map((c) => <CompletedRow key={c._dbId || c.id} task={c} lang={lang} />)}
                  </div>
                )}
                {tab === "messages" && (
                  <div className="space-y-2">{MESSAGES.map((m) => <MessageRow key={m.id} msg={m} lang={lang} onReply={() => setToast(t.toastReply)} />)}</div>
                )}
              </div>
            </>
          )}

          {/* === TASK DETAIL === */}
          {route.screen === "taskDetail" && selectedTask && (
            <div className="px-4 mt-3 pb-16 overflow-y-auto" style={{ maxHeight: 670 }}>
              <div className="flex items-center justify-between mb-2">
                <PriorityPill priority={selectedTask.priority} t={t} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, letterSpacing: "0.08em", fontWeight: 600 }}>{selectedTask.id}</span>
              </div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: "#F5F5F4", letterSpacing: "0.04em", lineHeight: 1.25, marginBottom: 8 }}>{selectedTask.title}</div>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <MetaCell label={t.tdHeaderIssued} value={selectedTask.issuedAt} mono />
                <MetaCell label={t.tdHeaderHandler} value={sessionHandler} mono />
                <MetaCell label={t.dueLabel}
                  value={formatDeadline(selectedTask.deadlineMinutes, t).text}
                  valueColor={formatDeadline(selectedTask.deadlineMinutes, t).color}
                  bold={formatDeadline(selectedTask.deadlineMinutes, t).bold} mono />
              </div>
              <div className="px-2.5 py-1.5 mb-3 flex items-center gap-2"
                style={{ border: `1px solid rgba(16,185,129,0.4)`, background: "rgba(16,185,129,0.05)" }}>
                <Scale size={12} style={{ color: GREEN }} strokeWidth={1.7} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: GREEN, letterSpacing: "0.12em", fontWeight: 600 }}>
                  {t.tdHeaderLegal} · {selectedTask.legalReview.toUpperCase()}
                </span>
              </div>
              <Section label={t.tdTarget} icon={Target}>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: "#F5F5F4", lineHeight: 1.55 }}>{selectedTask.target}</div>
              </Section>
              <Section label={t.tdGuidance} icon={Eye}>
                <ul className="space-y-1.5">
                  {selectedTask.guidance.map((g, i) => (
                    <li key={i} className="flex gap-2"
                      style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "rgba(245,245,244,0.85)", lineHeight: 1.5 }}>
                      <span style={{ color: AMBER, flexShrink: 0 }}>›</span><span>{g}</span>
                    </li>
                  ))}
                </ul>
              </Section>
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Flag size={11} style={{ color: RED_LIGHT }} strokeWidth={1.6} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: RED_LIGHT, letterSpacing: "0.12em" }}>── {t.tdConstraints}</span>
                </div>
                <div className="px-3 py-2"
                  style={{ background: "rgba(220,38,38,0.06)", border: `1px solid rgba(220,38,38,0.4)`,
                    fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 12.5, color: RED_LIGHT, letterSpacing: "0.06em", lineHeight: 1.4 }}>
                  {selectedTask.constraint}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                <div className="px-2.5 py-1.5" style={{ border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: AMBER_DIM, letterSpacing: "0.12em" }}>{t.tdLinkedCategory}</div>
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11.5, color: "#F5F5F4", marginTop: 1, fontWeight: 500 }}>{selectedTask.category} · {selectedTask.subCategory}</div>
                </div>
                <div className="px-2.5 py-1.5" style={{ border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: AMBER_DIM, letterSpacing: "0.12em" }}>{t.tdPirAlignment}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: AMBER, marginTop: 1, fontWeight: 600, letterSpacing: "0.06em" }}>{selectedTask.pir}</div>
                </div>
              </div>
              <button onClick={() => navigate("structured", { preSelectedCategory: selectedTask.category, preSelectedSubCategory: selectedTask.subCategory, fromTaskId: selectedTask.id })}
                className="w-full py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                style={{ background: AMBER, color: BG, border: `1px solid ${AMBER}`,
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em", marginBottom: 4 }}>
                <ArrowUpRight size={15} strokeWidth={2} />{t.startReport}
              </button>
              <div className="text-center" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: "rgba(245,245,244,0.45)", marginBottom: 12 }}>{t.startReportSub}</div>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => setConcernOpen(true)} className="py-2 flex items-center justify-center gap-1.5"
                  style={{ border: `1px solid rgba(245,158,11,0.5)`, color: ORANGE,
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>
                  <Scale size={12} strokeWidth={1.6} />{t.reportConcern}
                </button>
                <button onClick={() => { setToast(t.toastDeferred); setTimeout(() => goBack(), 1100); }}
                  className="py-2 flex items-center justify-center gap-1.5"
                  style={{ border: `1px solid ${HAIRLINE_STRONG}`, color: AMBER,
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>
                  <Clock size={12} strokeWidth={1.6} />{t.acknowledgeDefer}
                </button>
              </div>
            </div>
          )}

          {/* === DRAFTS placeholder === */}
          {route.screen === "drafts" && (
            <div className="px-4 mt-3 pb-16">
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.draftsTitle}</div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.draftsSub}</div>
              <div className="mt-3"><SyncBanner queueCount={syncQueue} t={t} /></div>
              <div className="mt-4 px-3 py-6 text-center"
                style={{ border: `1px dashed ${HAIRLINE_STRONG}`, background: "rgba(255,255,255,0.01)",
                  fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "rgba(245,245,244,0.55)", lineHeight: 1.5 }}>
                <FolderClock size={28} style={{ color: AMBER_DIM, margin: "0 auto 10px" }} strokeWidth={1.3} />
                {t.draftsEmpty}
              </div>
              <div className="mt-3 px-2.5 py-1.5 text-center"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.12em",
                  border: `1px dashed ${HAIRLINE}`, background: "rgba(201,169,97,0.03)", lineHeight: 1.4 }}>
                {t.draftsPlaceholderNote}
              </div>
            </div>
          )}

          {/* === SECURE / DURESS placeholder === */}
          {route.screen === "secure" && (
            <div className="px-4 mt-3 pb-16">
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#FCA5A5", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.secureTitle}</div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.secureSub}</div>
              <div className="mt-4 space-y-2">
                <ActionRow icon={Trash2} label={t.securePanic} sub={t.securePanicSub} danger
                  onTap={() => setToast(t.toastDuress)} />
                <ActionRow icon={RadioTower} label={t.secureDistress} sub={t.secureDistressSub} danger
                  onTap={() => setToast(t.toastDuress)} />
                <ActionRow icon={Radio} label={t.secureContact} sub={t.secureContactSub}
                  onTap={() => setToast(t.toastFutureScreen)} />
                <ActionRow icon={Lock} label={t.authLogoutButton} sub={t.authLogoutSub}
                  onTap={handleLogout} />
              </div>
              <div className="mt-4 px-2.5 py-2 text-center"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.12em",
                  border: `1px dashed ${HAIRLINE}`, background: "rgba(201,169,97,0.03)", lineHeight: 1.5 }}>
                {t.securePlaceholderNote}
              </div>
            </div>
          )}

          {/* === STRUCTURED PICKER === */}
          {route.screen === "structured" && (
            <div className="px-4 mt-3 pb-12 overflow-y-auto" style={{ maxHeight: 670 }}>
              {route.params.fromTaskId && (
                <div className="mb-2 px-2 py-1 flex items-center gap-1.5"
                  style={{ background: "rgba(201,169,97,0.10)", border: `1px solid ${AMBER}` }}>
                  <ArrowUpRight size={11} style={{ color: AMBER }} strokeWidth={2} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.12em" }}>
                    {t.prePopBanner} · {route.params.fromTaskId}
                  </span>
                </div>
              )}
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 17, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.structuredTitle}</div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.structuredSub}</div>
              <button className="mt-2.5 w-full flex items-center gap-2 px-3 py-2 transition-all"
                onClick={() => setToast(t.toastVoice)}
                style={{ border: `1px solid ${HAIRLINE_STRONG}`, background: "rgba(201,169,97,0.04)" }}>
                <Mic size={14} style={{ color: AMBER }} strokeWidth={1.5} />
                <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.8)" }}>{t.structuredVoiceHint}</span>
              </button>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {CATEGORIES.map((cat) => (
                  <CategoryCard key={cat.key} cat={cat} lang={lang}
                    hasTask={cat.key === "person"}
                    prePop={route.params.preSelectedCategory === cat.key}
                    onTap={handleCardTap} />
                ))}
              </div>
              <div className="mt-2">
                <CatchallCard cat={CATCHALL} lang={lang} onTap={handleCardTap} />
              </div>
            </div>
          )}

          {/* === QC PICKER === */}
          {route.screen === "qcPicker" && (
            <div className="px-4 mt-3 pb-12">
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.qcTitle}</div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.qcSub}</div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <MediaTile icon={Camera} label={t.photo} hint={t.photoHint} onTap={tapPhoto} />
                <MediaTile icon={Video} label={t.video} hint={t.videoHint} onTap={tapVideo} />
                <MediaTile icon={Mic} label={t.audio} hint={t.audioHint} onTap={tapAudio} />
                <MediaTile icon={MapPin} label={t.geoPin} hint={t.geoPinHint} onTap={tapGeo} />
              </div>
              <div className="mt-4 px-2.5 py-2 flex items-start gap-2"
                style={{ border: `1px dashed ${HAIRLINE}`, background: "rgba(16,185,129,0.04)" }}>
                <Lock size={11} style={{ color: GREEN, marginTop: 1 }} strokeWidth={1.6} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: GREEN, letterSpacing: "0.06em", lineHeight: 1.5 }}>{t.qcProtection}</span>
              </div>
            </div>
          )}

          {/* === QC VIDEO REC === */}
          {route.screen === "qcVideoRec" && (
            <div className="px-4 mt-3 pb-12">
              <div className="relative w-full" style={{ height: 280, border: `1px solid ${HAIRLINE_STRONG}`,
                background: "linear-gradient(180deg, #15191e 0%, #0d1014 50%, #181410 100%)", overflow: "hidden" }}>
                <CornerBrackets color={AMBER} />
                <div style={{ position: "absolute", left: 0, right: 0, top: "55%", height: 1,
                  background: "linear-gradient(90deg, transparent, rgba(201,169,97,0.4), transparent)" }} />
                <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                  <Crosshair size={48} color={AMBER} strokeWidth={1.2} style={{ opacity: 0.5 }} />
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1"
                  style={{ background: "rgba(220,38,38,0.2)", border: `1px solid ${RED}` }}>
                  <span style={{ width: 8, height: 8, background: RED, borderRadius: "50%", opacity: pulse ? 1 : 0.4, transition: "opacity 0.7s" }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#FCA5A5", letterSpacing: "0.12em", fontWeight: 700 }}>{t.recording}</span>
                </div>
                <div className="absolute top-2 right-2 px-2 py-1"
                  style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${HAIRLINE}`,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#F5F5F4", letterSpacing: "0.1em" }}>
                  {recClock}
                </div>
              </div>
              <div className="mt-3 text-center" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER_DIM, letterSpacing: "0.12em" }}>
                {t.videoCapture} · {t.tapToStop}
              </div>
              <button onClick={stopRecording} className="w-full mt-3 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                style={{ background: RED, color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em" }}>
                <Square size={14} fill="#fff" strokeWidth={0} />STOP
              </button>
            </div>
          )}

          {/* === QC AUDIO REC === */}
          {route.screen === "qcAudioRec" && (
            <div className="px-4 mt-3 pb-12">
              <div className="relative w-full" style={{ height: 280, border: `1px solid ${HAIRLINE_STRONG}`,
                background: BG, overflow: "hidden" }}>
                <CornerBrackets color={AMBER} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 px-2 py-1 mb-4"
                    style={{ background: "rgba(201,169,97,0.08)", border: `1px solid ${AMBER}` }}>
                    <span style={{ width: 8, height: 8, background: AMBER, borderRadius: "50%", opacity: pulse ? 1 : 0.4, transition: "opacity 0.7s" }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, letterSpacing: "0.12em", fontWeight: 700 }}>{t.listening}</span>
                  </div>
                  <WaveformBars active={true} />
                  <div className="mt-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: "#F5F5F4", letterSpacing: "0.1em" }}>{recClock}</div>
                </div>
              </div>
              <div className="mt-3 text-center" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER_DIM, letterSpacing: "0.12em" }}>
                {t.audioCapture} · {t.tapToStop}
              </div>
              <button onClick={stopRecording} className="w-full mt-3 py-3 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                style={{ background: AMBER, color: BG, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em" }}>
                <Square size={14} fill={BG} strokeWidth={0} />STOP
              </button>
            </div>
          )}

          {/* === QC REVIEW === */}
          {route.screen === "qcReview" && (
            <div className="px-4 mt-3 pb-12 overflow-y-auto" style={{ maxHeight: 670 }}>
              <div className="flex items-center justify-between mb-2">
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: "#F5F5F4", letterSpacing: "0.06em" }}>{t.reviewTitle}</div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.12em" }}>
                  {qcMediaType === "photo" ? t.photoTitle : qcMediaType === "video" ? t.videoTitle : qcMediaType === "audio" ? t.audioTitle : t.geoTitle}
                </span>
              </div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginBottom: 8 }}>{t.reviewSub}</div>

              {qcMediaType === "geo" ? (
                <>
                  <MapPreview offset={geoOffset} />
                  <div className="mt-2 flex items-center justify-between px-2.5 py-1.5"
                    style={{ border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.01)" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, letterSpacing: "0.1em" }}>{t.offsetLabel}</span>
                    <button onClick={() => setGeoOffset(!geoOffset)}
                      style={{ background: geoOffset ? AMBER : "transparent", color: geoOffset ? BG : AMBER,
                        border: `1px solid ${AMBER}`, padding: "3px 10px",
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em" }}>
                      {geoOffset ? t.locationOffsetOn : t.locationOffsetOff}
                    </button>
                  </div>
                </>
              ) : (
                <div className="relative w-full" style={{ height: 200, border: `1px solid ${HAIRLINE_STRONG}`,
                  background: "linear-gradient(180deg, #15191e, #0d1014)", overflow: "hidden" }}>
                  <CornerBrackets color={AMBER} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {qcMediaType === "photo" && <Camera size={48} color={AMBER_DIM} strokeWidth={1.3} />}
                    {qcMediaType === "video" && <Video size={48} color={AMBER_DIM} strokeWidth={1.3} />}
                    {qcMediaType === "audio" && <Mic size={48} color={AMBER_DIM} strokeWidth={1.3} />}
                    {qcMediaType === "video" && (
                      <div className="mt-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: AMBER, letterSpacing: "0.1em" }}>{t.duration} {recClock}</div>
                    )}
                    {qcMediaType === "audio" && (
                      <div className="mt-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: AMBER, letterSpacing: "0.1em" }}>{t.duration} {recClock}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge label={t.exifStripped} icon={Lock} ok />
                <Badge label={`${t.locationOffset} · ${geoOffset ? t.locationOffsetOn : t.locationOffsetOff}`} icon={MapPin} mono />
                <Badge label={t.mgrsValue} icon={Crosshair} mono />
              </div>

              <button onClick={() => setToast(t.toastVoice)}
                className="w-full mt-3 px-2.5 py-2 flex items-center justify-center gap-2"
                style={{ border: `1px dashed ${HAIRLINE_STRONG}`, background: "rgba(201,169,97,0.03)",
                  fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: AMBER }}>
                <Mic size={12} strokeWidth={1.5} />{t.addVoiceContext}
              </button>

              <div className="mt-4 space-y-2">
                <ActionRow icon={PenLine} label={t.actionTag} sub={t.actionTagSub}
                  onTap={() => navigate("structured")} />
                <ActionRow icon={Send} label={t.actionSubmit} sub={t.actionSubmitSub} onTap={submitRaw} />
                <ActionRow icon={Trash2} label={t.actionDiscard} sub={t.actionDiscardSub} danger
                  onTap={() => setDiscardOpen(true)} />
              </div>
            </div>
          )}

          {/* === DRONE LANDING === */}
          {route.screen === "droneLanding" && (
            <div className="px-4 mt-3 pb-12 overflow-y-auto" style={{ maxHeight: 670 }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.droneTitle}</div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.droneSub}</div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.15em" }}>── {t.droneStatus}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: GREEN, letterSpacing: "0.1em" }}>● {t.droneConnected}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <DroneStatusRow icon={Plane} label={t.droneModel} value={t.droneModelValue} />
                  <DroneStatusRow icon={Battery} label={t.droneBattery} value="87%" color={GREEN} />
                  <DroneStatusRow icon={Satellite} label={t.droneGps} value="12 SAT" color={GREEN} />
                  <DroneStatusRow icon={Radio} label={t.droneLink} value="-68 dBm" color={GREEN} />
                </div>
              </div>
              <div className="mt-3 px-2.5 py-2" style={{ border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.01)" }}>
                <div className="flex items-center gap-2">
                  <Activity size={11} style={{ color: AMBER_DIM }} strokeWidth={1.5} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER_DIM, letterSpacing: "0.12em" }}>{t.droneNoMission}</span>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <ModeCard icon={PlusCircle} title={t.pathNew} sub={t.pathNewSub} hint="IA §4.3" onTap={startNewMission} />
                <ModeCard icon={History} title={t.pathResume} sub={t.pathResumeSub} hint="(no active mission)" onTap={() => setToast(t.toastResume)} />
                <ModeCard icon={FolderClock} title={t.pathHistory} sub={t.pathHistorySub} hint="IA §4.3" onTap={() => setToast(t.toastPast)} />
              </div>
              <div className="mt-4 flex items-start gap-2 px-2.5 py-2"
                style={{ border: `1px dashed ${HAIRLINE_STRONG}`, background: "rgba(220,38,38,0.04)" }}>
                <AlertTriangle size={11} style={{ color: "#FCA5A5", marginTop: 1 }} strokeWidth={1.6} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#FCA5A5", letterSpacing: "0.06em", lineHeight: 1.5 }}>{t.droneOpsec}</span>
              </div>
            </div>
          )}

          {/* === PRE-MISSION === */}
          {route.screen === "preMission" && (
            <div className="px-4 mt-3 pb-12 overflow-y-auto" style={{ maxHeight: 670 }}>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 17, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.preMissionTitle}</div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.preMissionSub}</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <MetaCell label={t.missionIdLabel} value={t.droneMissionId} mono valueColor={AMBER} />
                <MetaCell label={t.estDurationLabel} value={t.estDurationValue} mono valueColor={AMBER} />
              </div>
              <div className="mt-2">
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: AMBER_DIM, letterSpacing: "0.12em", marginBottom: 4 }}>{t.missionNameLabel}</div>
                <input value={missionName} onChange={(e) => setMissionName(e.target.value)} placeholder={t.missionNamePlaceholder}
                  className="w-full px-2.5 py-1.5"
                  style={{ border: `1px solid ${HAIRLINE_STRONG}`, background: "rgba(255,255,255,0.02)",
                    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12, color: "#F5F5F4", outline: "none" }} />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.15em" }}>── {t.waypointsLabel} · {t.waypointsCount}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#FCA5A5", letterSpacing: "0.1em" }}>{t.noFlyLabel} · {t.noFlyCount}</span>
                </div>
                <TacticalMap waypoints={waypoints} showRoute />
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Target size={11} style={{ color: AMBER }} strokeWidth={1.5} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.15em" }}>{t.targetsLabel} · {t.targetsCount}</span>
                </div>
                <div className="px-2.5 py-1.5" style={{ border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.01)" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#F5F5F4", letterSpacing: "0.05em" }}>{t.targetExample}</span>
                </div>
              </div>
              <div className="mt-3">
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.15em", marginBottom: 6 }}>── {t.checklistTitle}</div>
                <div className="space-y-1.5">
                  <ChecklistItem checked={checkOpsec} label={t.checkOpsec} sub={t.checkOpsecSub} onToggle={() => setCheckOpsec(!checkOpsec)} />
                  <ChecklistItem checked={checkNofly} label={t.checkNofly} sub={t.checkNoflySub} onToggle={() => setCheckNofly(!checkNofly)} />
                  <ChecklistItem checked={checkBattery} locked label={t.checkBattery} sub={t.checkBatterySub} />
                  <ChecklistItem checked={checkGps} locked label={t.checkGps} sub={t.checkGpsSub} />
                </div>
              </div>
              <div className="mt-3 px-2.5 py-2.5" style={{
                border: `1px solid ${authState === "approved" ? GREEN : authState === "requested" ? "#F59E0B" : HAIRLINE_STRONG}`,
                background: authState === "approved" ? "rgba(16,185,129,0.05)" : authState === "requested" ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.01)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={12} style={{ color: AMBER_DIM }} strokeWidth={1.5} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER_DIM, letterSpacing: "0.12em" }}>{t.authStatus}</span>
                  </div>
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em",
                    color: authState === "approved" ? GREEN : authState === "requested" ? ORANGE : AMBER }}>
                    {authState === "approved" ? t.authApproved : authState === "requested" ? t.authRequested : t.authPending}
                  </span>
                </div>
                {authState === "pending" && (
                  <button onClick={requestAuth} className="w-full mt-2 py-2"
                    style={{ border: `1px solid ${AMBER}`, color: AMBER,
                      fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em" }}>
                    {t.requestAuth}
                  </button>
                )}
                {authState === "requested" && (
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.authPendingHint}</div>
                )}
              </div>
              <button onClick={launchMission} disabled={!canLaunch} className="w-full mt-3 py-3 transition-all"
                style={{ background: canLaunch ? AMBER : "transparent", color: canLaunch ? BG : AMBER_DIM,
                  border: `1px solid ${canLaunch ? AMBER : HAIRLINE}`, fontFamily: "'Rajdhani', sans-serif",
                  fontWeight: 700, fontSize: 14, letterSpacing: "0.16em", cursor: canLaunch ? "pointer" : "not-allowed" }}>
                {t.launchMission}
              </button>
              {!canLaunch && (
                <div className="text-center mt-1.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, color: AMBER_DIM, letterSpacing: "0.08em" }}>
                  {t.launchBlocked}
                </div>
              )}
            </div>
          )}

          {/* === LIVE FLIGHT === */}
          {route.screen === "liveFlight" && (
            <div className="px-3 mt-2.5 pb-2 flex flex-col" style={{ height: 720 }}>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, background: RED, borderRadius: "50%", opacity: pulse ? 1 : 0.4, transition: "opacity 0.7s" }} />
                  <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, color: "#FCA5A5", letterSpacing: "0.16em" }}>{t.flightTitle}</span>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, letterSpacing: "0.1em" }}>{t.droneMissionId}</span>
              </div>
              <div className="relative w-full" style={{ flex: "1 1 auto", minHeight: 280, maxHeight: 380,
                border: `1px solid ${HAIRLINE_STRONG}`, background: "linear-gradient(180deg, #15191e 0%, #0d1014 50%, #181410 100%)", overflow: "hidden" }}>
                <CornerBrackets color={AMBER} />
                <div style={{ position: "absolute", left: 0, right: 0, top: "55%", height: 1,
                  background: "linear-gradient(90deg, transparent, rgba(201,169,97,0.4), transparent)" }} />
                <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
                  <Crosshair size={48} color={AMBER} strokeWidth={1.2} style={{ opacity: 0.7 }} />
                </div>
                <div className="absolute top-2 left-2 px-2 py-1"
                  style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${HAIRLINE}`,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#F5F5F4", letterSpacing: "0.1em", lineHeight: 1.4 }}>
                  <div><span style={{ color: AMBER_DIM }}>{t.altLabel}</span> 142m</div>
                  <div><span style={{ color: AMBER_DIM }}>{t.spdLabel}</span> 18kt</div>
                </div>
                <div className="absolute top-2 right-2 px-2 py-1"
                  style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${HAIRLINE}`,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    color: battery > 60 ? GREEN : battery > 40 ? ORANGE : "#FCA5A5", letterSpacing: "0.1em", lineHeight: 1.4 }}>
                  <div><span style={{ color: AMBER_DIM }}>{t.droneBattery}</span> {battery}%</div>
                  <div><span style={{ color: AMBER_DIM }}>{t.elapsedLabel}</span> {flightClock}</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 flex items-center justify-between"
                  style={{ background: "rgba(0,0,0,0.6)", borderTop: `1px solid ${HAIRLINE}`,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em" }}>
                  <span style={{ color: AMBER_DIM }}>{t.droneAt} · 14R PU 64833 53120</span>
                  <span style={{ color: AMBER }}>{t.nextWaypoint} 2/3</span>
                </div>
                {captures.length > 0 && (
                  <div className="absolute bottom-7 right-2 px-2 py-0.5"
                    style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${GREEN}55`, color: GREEN,
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.1em" }}>
                    {t.captureCount} · {captures.length}
                  </div>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => captureMedia("photo")}
                  className="py-2.5 flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ border: `1px solid ${AMBER}`, background: "rgba(201,169,97,0.06)", color: AMBER,
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em" }}>
                  <Camera size={14} strokeWidth={1.6} />{t.capturePhoto}
                </button>
                <button onClick={() => captureMedia("video")}
                  className="py-2.5 flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ border: `1px solid ${AMBER}`, background: "rgba(201,169,97,0.06)", color: AMBER,
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em" }}>
                  <Video size={14} strokeWidth={1.6} />{t.captureVideo}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <button onClick={() => setToast(t.toastRTH)} className="py-2 flex flex-col items-center justify-center"
                  style={{ border: `1px solid ${HAIRLINE_STRONG}`, color: "#F5F5F4",
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em" }}>
                  <Home size={14} strokeWidth={1.5} />{t.rth}
                </button>
                <button onClick={completeMission} className="py-2 flex flex-col items-center justify-center"
                  style={{ border: `1px solid ${GREEN}`, color: GREEN, background: "rgba(16,185,129,0.05)",
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em" }}>
                  <CheckCircle2 size={14} strokeWidth={1.5} />{t.completeMission}
                </button>
                <button onClick={() => setAbortOpen(true)} className="py-2 flex flex-col items-center justify-center"
                  style={{ border: `1px solid ${RED}`, color: "#FCA5A5",
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em" }}>
                  <Power size={14} strokeWidth={1.5} />{t.abortMission}
                </button>
              </div>
            </div>
          )}

          {/* === POST-MISSION === */}
          {route.screen === "postMission" && (
            <div className="px-4 mt-3 pb-12 overflow-y-auto" style={{ maxHeight: 670 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 17, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.droneReviewTitle}</div>
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.droneReviewSub}</div>
                </div>
                <span className="px-1.5 py-0.5"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                    background: missionStatus === "complete" ? GREEN : RED, color: BG, letterSpacing: "0.08em" }}>
                  {missionStatus === "complete" ? t.statusComplete : t.statusAborted}
                </span>
              </div>
              <div className="mt-3">
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.15em", marginBottom: 6 }}>── {t.missionSummary}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <DroneStatusRow icon={Clock} label={t.summaryDuration} value={flightClock} />
                  <DroneStatusRow icon={Compass} label={t.summaryDistance} value="2.1 km" />
                  <DroneStatusRow icon={Eye} label={t.summaryCaptures} value={String(captures.length)} color={captures.length > 0 ? GREEN : AMBER_DIM} />
                </div>
              </div>
              <div className="mt-3">
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.15em", marginBottom: 6 }}>── {t.routePlayback}</div>
                <TacticalMap waypoints={waypoints} showRoute height={150} animate />
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.15em" }}>── {t.capturesLabel} · {captures.length}</span>
                </div>
                {captures.length === 0 ? (
                  <div className="px-2.5 py-3 text-center"
                    style={{ border: `1px dashed ${HAIRLINE}`, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: AMBER_DIM }}>
                    No captures during this mission
                  </div>
                ) : (
                  <div className="space-y-2">
                    {captures.map((c, i) => (
                      <CaptureRow key={i} type={c.type} time={c.time} mgrs={c.mgrs} t={t}
                        onTag={() => setToast(t.toastTagged)}
                        onSubmit={() => setToast(t.toastTagged)}
                        onDiscard={() => { setCaptures(captures.filter((_, idx) => idx !== i)); setToast(t.toastDiscarded); }} />
                    ))}
                  </div>
                )}
              </div>
              <button onClick={submitMissionReport} className="w-full mt-4 py-3 transition-all active:scale-[0.99]"
                style={{ background: AMBER, color: BG, border: `1px solid ${AMBER}`,
                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em" }}>
                {t.submitMissionReport}
              </button>
              <div className="text-center mt-1.5" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: "rgba(245,245,244,0.45)" }}>{t.submitMissionSub}</div>
            </div>
          )}
          {/* === WIZARD: PERSON > NEW PERSON SEEN === */}
          {route.screen === "wizardNewPerson" && (() => {
            const sumWhoVal = [
              wzSex && SEX_OPTIONS.find(o => o.key === wzSex)?.[lang],
              wzAge && AGE_OPTIONS.find(o => o.key === wzAge)?.[lang],
              wzBuild && BUILD_OPTIONS.find(o => o.key === wzBuild)?.[lang],
              wzFeatures,
            ].filter(Boolean).join(" · ");
            const sumWhereVal = [wzNamedPlace, `MGRS 14R PU 64829 53117 ${wzOffset ? "(offset)" : "(real)"}`].filter(Boolean).join(" · ");
            const sumWhenVal = wzTime && TIME_OPTIONS.find(o => o.key === wzTime)?.[lang];
            const sumMediaVal = [
              wzPhotoAttached && `${t.sumPhoto} ${wzPhotoAttached}`,
              wzVoiceAttached && `${t.sumVoice} ${wzVoiceAttached}`,
            ].filter(Boolean).join(" · ");
            return (
              <>
                <div className="mt-3"><ProgressDots step={wzStep} total={4} t={t} /></div>
                <div className="px-4 mt-3 pb-20 overflow-y-auto" style={{ maxHeight: 600 }}>
                  {wzStep === 1 && (
                    <>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.step1Title}</div>
                      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.step1Sub}</div>
                      <VoicePrompt t={t} onTap={() => setToast(t.toastVoice)} />
                      <div className="mt-3">
                        <ChipRow label={t.sexLabel} options={SEX_OPTIONS} value={wzSex} onChange={setWzSex} lang={lang} />
                        <ChipRow label={t.ageLabel} options={AGE_OPTIONS} value={wzAge} onChange={setWzAge} lang={lang} />
                        <ChipRow label={t.buildLabel} options={BUILD_OPTIONS} value={wzBuild} onChange={setWzBuild} lang={lang} />
                        <WizardTextField label={t.featuresLabel} value={wzFeatures} onChange={setWzFeatures} placeholder={t.featuresPlaceholder} multiline />
                      </div>
                    </>
                  )}
                  {wzStep === 2 && (
                    <>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.step2Title}</div>
                      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.step2Sub}</div>
                      <VoicePrompt t={t} onTap={() => setToast(t.toastVoice)} />
                      <div className="mt-3">
                        <div className="mb-1.5">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em" }}>── {t.locationLabel}</span>
                        </div>
                        <LocationMapMini offset={wzOffset} />
                        <div className="mt-2 flex items-center justify-between px-2.5 py-1.5"
                          style={{ border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.01)" }}>
                          <div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, letterSpacing: "0.1em" }}>{t.wzOffsetLabel}</div>
                            <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: AMBER_DIM, marginTop: 2 }}>
                              {wzOffset ? t.wzOffsetOnDesc : t.wzOffsetOffDesc}
                            </div>
                          </div>
                          <button onClick={() => setWzOffset(!wzOffset)}
                            style={{ background: wzOffset ? AMBER : "transparent", color: wzOffset ? BG : AMBER,
                              border: `1px solid ${AMBER}`, padding: "3px 10px",
                              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.1em" }}>
                            {wzOffset ? "ON" : "OFF"}
                          </button>
                        </div>
                        <div className="mt-3">
                          <WizardTextField label={t.namedPlaceLabel} value={wzNamedPlace} onChange={setWzNamedPlace} placeholder={t.namedPlacePlaceholder} />
                        </div>
                        <ChipRow label={t.timeLabel} options={TIME_OPTIONS} value={wzTime} onChange={setWzTime} lang={lang} />
                        <WizardTextField label={t.activityLabel} value={wzActivity} onChange={setWzActivity} placeholder={t.activityPlaceholder} multiline />
                      </div>
                    </>
                  )}
                  {wzStep === 3 && (
                    <>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.step3Title}</div>
                      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.step3Sub}</div>
                      <VoicePrompt t={t} onTap={() => setToast(t.toastVoice)} />
                      <div className="mt-3 mb-3">
                        <div className="mb-1.5">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em" }}>── {t.wzPhotoLabel}</span>
                        </div>
                        {wzPhotoAttached
                          ? <AttachedMedia icon={Camera} label={t.wzPhotoAttached} id={wzPhotoAttached} onRemove={() => setWzPhotoAttached(null)} t={t} />
                          : <EmptyMediaSlot icon={Camera} label={t.wzPhotoLabel} hint={t.wzPhotoEmptyHint} onTap={wzTapPhoto} />}
                      </div>
                      <div className="mb-3">
                        <div className="mb-1.5">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em" }}>── {t.wzVoiceLabel}</span>
                        </div>
                        {wzVoiceRecording ? (
                          <div className="w-full p-3 flex items-center gap-3"
                            style={{ border: `1px solid ${RED}`, background: "rgba(220,38,38,0.05)" }}>
                            <div className="flex items-center justify-center flex-shrink-0"
                              style={{ width: 40, height: 40, border: `1px solid ${RED}`, color: RED }}>
                              <Mic size={18} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <span style={{ width: 8, height: 8, background: RED, borderRadius: "50%", opacity: pulse ? 1 : 0.4, transition: "opacity 0.7s" }} />
                                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 12, color: RED_LIGHT, letterSpacing: "0.12em" }}>
                                  {t.wzRecording}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : wzVoiceAttached
                          ? <AttachedMedia icon={Mic} label={t.wzVoiceAttached} id="VOC_S7421_NPS_001" dur={wzVoiceAttached} onRemove={() => setWzVoiceAttached(null)} t={t} />
                          : <EmptyMediaSlot icon={Mic} label={t.wzVoiceLabel} hint={t.wzVoiceEmptyHint} onTap={wzTapVoice} />}
                      </div>
                    </>
                  )}
                  {wzStep === 4 && (
                    <>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 18, color: "#F5F5F4", letterSpacing: "0.06em", lineHeight: 1.15 }}>{t.step4Title}</div>
                      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 11, color: "rgba(245,245,244,0.5)", marginTop: 4 }}>{t.step4Sub}</div>
                      <div className="mt-3 mb-3">
                        <div className="mb-1.5">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em" }}>── {t.summaryLabel}</span>
                        </div>
                        <div className="px-3 py-1" style={{ border: `1px solid ${HAIRLINE}`, background: "rgba(255,255,255,0.01)" }}>
                          <SummaryRow label={t.sumWho} value={sumWhoVal} t={t} />
                          <SummaryRow label={t.sumWhere} value={sumWhereVal} t={t} />
                          <SummaryRow label={t.sumWhen} value={sumWhenVal} t={t} />
                          <SummaryRow label={t.sumActivity} value={wzActivity} t={t} />
                          <SummaryRow label={t.sumMedia} value={sumMediaVal} t={t} />
                        </div>
                      </div>
                      <div className="mb-3.5">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em" }}>── {t.basisLabel}</span>
                          <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: AMBER_DIM }}>{t.basisHint}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {BASIS_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const active = wzBasis === opt.key;
                            return (
                              <button key={opt.key} onClick={() => setWzBasis(opt.key)}
                                className="py-2 px-2 transition-all flex flex-col items-center justify-center gap-1"
                                style={{ background: active ? AMBER : "transparent", color: active ? BG : AMBER,
                                  border: `1px solid ${active ? AMBER : HAIRLINE_STRONG}`,
                                  fontFamily: "'Rajdhani', sans-serif", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em",
                                  lineHeight: 1.15, textAlign: "center", minHeight: 52 }}>
                                {Icon && <Icon size={12} strokeWidth={1.8} />}
                                <div>{opt[lang]}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: AMBER, letterSpacing: "0.14em" }}>── {t.confidenceLabel}</span>
                          <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: AMBER_DIM }}>{t.confidenceHint}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {CONFIDENCE_OPTIONS.map((opt) => {
                            const active = wzConfidence === opt.key;
                            return (
                              <button key={opt.key} onClick={() => setWzConfidence(opt.key === wzConfidence ? null : opt.key)}
                                className="py-2 px-2 transition-all"
                                style={{ background: active ? opt.color : "transparent", color: active ? BG : opt.color,
                                  border: `1px solid ${opt.color}`,
                                  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em" }}>
                                <div>{opt[lang]}</div>
                                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 9, fontWeight: 400, marginTop: 2,
                                  color: active ? BG : "rgba(245,245,244,0.55)", letterSpacing: "0" }}>{opt.desc[lang]}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="px-2.5 py-1.5 mb-3" style={{ border: `1px dashed ${HAIRLINE}`, background: "rgba(201,169,97,0.03)",
                        fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 10, color: AMBER_DIM, lineHeight: 1.5, fontStyle: "italic" }}>
                        {t.legalNote}
                      </div>
                    </>
                  )}
                </div>
                {/* Pinned action bar */}
                <div className="absolute left-0 right-0 px-4 py-2.5"
                  style={{ bottom: 36, borderTop: `1px solid ${HAIRLINE}`, background: BG }}>
                  {wzStep < 4 ? (
                    <div className="flex gap-2">
                      <button onClick={wzPrev} className="px-3 py-2"
                        style={{ border: `1px solid ${HAIRLINE_STRONG}`, color: AMBER,
                          fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em" }}>
                        {t.wzBack}
                      </button>
                      <button onClick={wzNext} className="flex-1 py-2"
                        style={{ background: AMBER, color: BG, border: `1px solid ${AMBER}`,
                          fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em" }}>
                        {t.wzNext}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button onClick={wzPrev} className="px-3 py-2"
                          style={{ border: `1px solid ${HAIRLINE_STRONG}`, color: AMBER,
                            fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em" }}>
                          {t.wzBack}
                        </button>
                        <button onClick={wzSubmit} disabled={!wzCanSubmit}
                          className="flex-1 py-2 transition-all"
                          style={{ background: wzCanSubmit ? AMBER : "transparent",
                            color: wzCanSubmit ? BG : AMBER_DIM,
                            border: `1px solid ${wzCanSubmit ? AMBER : HAIRLINE}`,
                            fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em",
                            cursor: wzCanSubmit ? "pointer" : "not-allowed" }}>
                          {t.wzSubmit}
                        </button>
                      </div>
                      {!wzCanSubmit && (
                        <div className="text-center mt-1.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, color: AMBER_DIM, letterSpacing: "0.08em" }}>
                          {t.confidenceRequired}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {/* Wizard photo flash overlay */}
                {wzPhotoFlash && (
                  <div className="absolute inset-0 z-[55]" style={{ background: "white", opacity: 0.85, animation: "fadeOut 220ms forwards" }} />
                )}
              </>
            );
          })()}
          {/* SCREEN_INSERTION_POINT_B */}

          {/* Photo flash overlay */}
          {photoFlash && (
            <div className="absolute inset-0 z-[55]" style={{ background: "white", opacity: 0.85, animation: "fadeOut 220ms forwards" }} />
          )}

          {/* Submit OK overlay */}
          {submitOk && (
            <div className="absolute inset-0 z-[55] flex flex-col items-center justify-center"
              style={{ background: "rgba(10,11,13,0.95)" }}>
              <CheckCircle2 size={64} color={GREEN} strokeWidth={1.4} />
              <div className="mt-3" style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 16, color: GREEN, letterSpacing: "0.14em" }}>
                {t.submitOk}
              </div>
              <div className="mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER_DIM, letterSpacing: "0.1em" }}>
                QUEUE · {syncQueue}
              </div>
            </div>
          )}

          {/* Floating duress (always present) */}
          <button className="absolute z-40 flex items-center justify-center"
            style={{ bottom: 60, right: 16, width: 44, height: 44, borderRadius: 22,
              background: "rgba(220,38,38,0.12)", border: `1px solid ${RED}`,
              boxShadow: pulse ? "0 0 0 4px rgba(220,38,38,0.18)" : "0 0 0 0 rgba(220,38,38,0)",
              transition: "box-shadow 0.7s ease-out" }}
            title="DURESS" onClick={() => setToast(t.toastDuress)}>
            <ShieldAlert size={18} style={{ color: RED }} strokeWidth={1.6} />
          </button>

          {/* Footer */}
          <div className="absolute left-0 right-0 bottom-0 px-4 py-2 flex items-center justify-between"
            style={{ borderTop: `1px solid ${HAIRLINE}`, background: BG }}>
            <button onClick={() => setLang(lang === "en" ? "es" : "en")} className="flex items-center gap-1.5 px-2 py-1"
              style={{ border: `1px solid ${HAIRLINE_STRONG}` }}>
              <Languages size={12} style={{ color: AMBER }} strokeWidth={1.5} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: AMBER, letterSpacing: "0.1em" }}>
                {lang === "en" ? "EN→ES" : "ES→EN"}
              </span>
            </button>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(245,245,244,0.3)", letterSpacing: "0.12em" }}>
              {t.appVer}
            </div>
          </div>

          <Toast text={toast} />
          <ConcernModal open={concernOpen} t={t} onClose={() => setConcernOpen(false)} onSend={() => { setConcernOpen(false); setToast(t.toastConcern); }} />
          <GatedModal open={gatedOpen} t={t} onClose={() => setGatedOpen(false)} />
          <SubCategoryModal open={!!activeSubCat} cat={activeSubCat} lang={lang} t={t}
            onClose={() => setActiveSubCat(null)} onPickSub={handlePickSub} />
          <DiscardModal open={discardOpen} t={t} onConfirm={() => { setDiscardOpen(false); goBack(); setToast(t.toastDiscarded); }} onCancel={() => setDiscardOpen(false)} />
          <AbortModal open={abortOpen} t={t} onConfirm={() => { setAbortOpen(false); setMissionStatus("aborted"); setRoute(prev => ({ screen: "postMission", history: prev.history.slice(0, -1), params: {} })); }} onCancel={() => setAbortOpen(false)} />

        </div>
      </div>
    </div>
  );
}
