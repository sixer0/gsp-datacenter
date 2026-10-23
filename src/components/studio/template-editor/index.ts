/**
 * UI templat Studio (S58; ditulis ulang SR-29 untuk UX-01 W2/W3): daftar +
 * dialog Buat templat, editor langkah Gaya/Pengaturan/Simpan versi, mode gaya
 * ADMIN, riwayat versi. Komponen klien.
 *
 * Ekspor bersama untuk Susunan dokumen (SR-28): `TemplateStepper`,
 * `SaveVersion`, dan draf `template-draft` (satu simpan gabungan, D-163 T-2).
 */
export { TemplateList } from "./template-list";
export { TemplateEditor, type EditorStep } from "./template-editor";
export { VersionHistory } from "./version-history";
export { TemplateStepper, TEMPLATE_STEPS, templateStepHref, type TemplateStepId, type TemplateStepStatus, type TemplateStepperProps } from "./template-stepper";
export { SaveVersion, CHANGE_NOTE_MAX, type SaveVersionProps } from "./save-version";
export { clearTemplateDraft, readTemplateDraft, writeTemplateDraft, type TemplateDraft } from "./template-draft";
