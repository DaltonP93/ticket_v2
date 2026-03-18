export class SettingsService {
  getFeatureFlags() {
    return {
      modularIntegrations: true,
      customPrintTemplates: true,
      dynamicTriageForms: true,
      panelProfiles: true,
      multimediaPlaylists: true,
      multilingualUi: true,
      audioAnnouncements: true
    };
  }

  getSystemSummary() {
    return {
      productName: "Sistema de Ticket V2",
      release: "3.0.0",
      mode: "modular",
      target: "salud, banca, retail, gobierno y corporativo",
      supportedLocales: ["es", "en", "pt"]
    };
  }
}
