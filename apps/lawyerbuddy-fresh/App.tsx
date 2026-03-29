import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal, Keyboard, SafeAreaView, Linking, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Notifications from 'expo-notifications'; // TODO: Set up push notifications

// 🌐 Translations
const TRANSLATIONS = {
  en: {
    // Login & Auth
    email: 'Email',
    password: 'Password',
    login: 'Login',
    logout: 'Logout',
    lawyerBuddy: 'LawyerBuddy',
    tuAbogado: 'Tu Abogado',
    dontHaveAccount: "Don't have an account?",
    signUp: 'Sign up',
    // Dashboard
    myCases: 'My Cases',
    myCase: 'My Case',
    newCase: 'New Case',
    noCase: 'No cases assigned yet',
    noCases: 'No cases yet',
    createFirstCase: 'Create your first case to get started',
    good: 'Good',
    morning: 'morning',
    afternoon: 'afternoon',
    evening: 'evening',
    // Case Details
    caseType: 'Case Type',
    docketNumber: 'Docket',
    status: 'Status',
    active: 'Active',
    client: 'Client',
    noClient: 'No client assigned',
    lawyer: 'Lawyer',
    created: 'Created',
    // Checklist
    checklist: 'Checklist',
    yourChecklist: 'Your Checklist',
    noItems: 'No items yet',
    addItem: 'Add Item',
    itemsComplete: 'items complete',
    // Messages
    messages: 'Messages',
    sendMessage: 'Send Message',
    typeMessage: 'Type a message...',
    noMessages: 'No messages yet',
    // Documents
    documents: 'Documents',
    uploadDocument: 'Upload Document',
    noDocuments: 'No documents yet',
    // Court Dates
    keyDates: 'Key Dates',
    courtDates: 'Court Dates',
    addDate: 'Add Date',
    noDates: 'No key dates yet',
    dateLabel: 'Date Label',
    courtDate: 'Court Date',
    fillingDeadline: 'Filing Deadline',
    upcoming: 'Upcoming',
    past: 'Past',
    // Invite
    inviteClient: 'Invite Client',
    clientEmail: 'Client Email Address',
    enterClientEmail: 'Enter client email',
    sendInvite: 'Send Invite',
    inviteSent: 'Invite sent!',
    // Modals
    newCaseTitle: 'New Case',
    acceptInvite: 'Accept Invite',
    createCase: 'Create Case',
    caseTitlePlaceholder: 'Enter case title',
    caseTypePlaceholder: 'e.g. Family Law',
    docketInfo: 'Optional court reference number',
    selectTemplate: 'Select Template (optional)',
    fullName: 'Full Name',
    createPassword: 'Create a password',
    createAccount: 'Create Account & Accept',
    cancel: 'Cancel',
    // Button states
    loading: 'Loading...',
    saving: 'Saving...',
    optional: 'Optional',
    // Case Types
    familyLaw: 'Family Law',
    civil: 'Civil',
    compliance: 'Compliance/Forms',
    criminalDefense: 'Criminal Defense',
    other: 'Other',
    general: 'General Law',
    // Case Management
    archive: 'Archive',
    delete: 'Delete',
    restore: 'Restore',
    deletePermanently: 'Delete Permanently',
    deleteConfirm: 'Are you sure? This cannot be undone.',
    archived: 'Archived',
    showArchived: 'Show Archived',
    hideArchived: 'Hide Archived',
    trash: 'Trash',
    recovery: 'Recovery',
    recover: 'Recover from Trash',
    recoveryWindow: '30-day recovery window',
    all: 'All',
    apply: 'Apply',
    ok: 'OK',
    search: 'Search cases...',
    filter: 'Filter',
    // Case Detail Screen
    caseInfo: 'Case Information',
    inProgress: 'In Progress',
    closed: 'Closed',
    docket: 'Docket Number',
    yourLawyer: 'Your Lawyer',
    contactLawyer: 'Contact Lawyer',
    emailLawyer: 'Email Lawyer',
    none: 'None',
    untitledCase: 'Untitled Case',
    back: 'Back',
    contactYourLawyer: 'Contact Your Lawyer',
    // Checklist Templates
    signRetainer: 'Sign retainer agreement',
    gatherFinancial: 'Gather financial documents',
    collectChildDocs: 'Collect child custody documentation',
    fileInitialPetition: 'File initial petition',
    serveSpouse: 'Serve spouse with papers',
    attendMediation: 'Attend mediation session',
    prepareSettlement: 'Prepare settlement agreement',
    completeAudit: 'Complete compliance audit',
    fileRequiredForms: 'File required forms with government',
    updatePrivacy: 'Update privacy policy',
    documentCompliance: 'Document compliance procedures',
    trainStaff: 'Train staff on requirements',
    scheduleFollowUp: 'Schedule follow-up audit',
    reviewPolice: 'Review police report',
    investigateArrest: 'Investigate arrest circumstances',
    fileDiscovery: 'File discovery motions',
    prepareDefense: 'Prepare defense strategy',
    arrangeMeeting: 'Arrange client meeting',
    prepareBail: 'Prepare bail/release arguments',
  },
  es: {
    // Login & Auth
    email: 'Correo Electrónico',
    password: 'Contraseña',
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    lawyerBuddy: 'LawyerBuddy',
    tuAbogado: 'Tu Abogado',
    dontHaveAccount: '¿No tienes cuenta?',
    signUp: 'Regístrate',
    // Dashboard
    myCases: 'Mis Casos',
    myCase: 'Mi Caso',
    newCase: 'Nuevo Caso',
    noCase: 'Aún no hay casos asignados',
    noCases: 'Sin casos todavía',
    createFirstCase: 'Crea tu primer caso para empezar',
    good: 'Buenos',
    morning: 'días',
    afternoon: 'tardes',
    evening: 'noches',
    // Case Details
    caseType: 'Tipo de Caso',
    docketNumber: 'Expediente',
    status: 'Estado',
    active: 'Activo',
    client: 'Cliente',
    noClient: 'Sin cliente asignado',
    lawyer: 'Abogado',
    created: 'Creado',
    // Checklist
    checklist: 'Lista de Verificación',
    yourChecklist: 'Tu Lista de Verificación',
    noItems: 'Sin elementos todavía',
    addItem: 'Agregar Elemento',
    itemsComplete: 'elementos completados',
    // Messages
    messages: 'Mensajes',
    sendMessage: 'Enviar Mensaje',
    typeMessage: 'Escribe un mensaje...',
    noMessages: 'Sin mensajes todavía',
    // Documents
    documents: 'Documentos',
    uploadDocument: 'Subir Documento',
    noDocuments: 'Sin documentos todavía',
    // Court Dates
    keyDates: 'Fechas Importantes',
    courtDates: 'Fechas Judiciales',
    addDate: 'Agregar Fecha',
    noDates: 'Sin fechas importantes todavía',
    dateLabel: 'Etiqueta de Fecha',
    courtDate: 'Audiencia Judicial',
    fillingDeadline: 'Plazo de Presentación',
    upcoming: 'Próximamente',
    past: 'Pasado',
    // Invite
    inviteClient: 'Invitar Cliente',
    clientEmail: 'Correo del Cliente',
    enterClientEmail: 'Ingresa correo del cliente',
    sendInvite: 'Enviar Invitación',
    inviteSent: '¡Invitación enviada!',
    // Modals
    newCaseTitle: 'Nuevo Caso',
    acceptInvite: 'Aceptar Invitación',
    createCase: 'Crear Caso',
    caseTitlePlaceholder: 'Ingresa el título del caso',
    caseTypePlaceholder: 'p.ej. Derecho de Familia',
    docketInfo: 'Número de referencia del tribunal (opcional)',
    selectTemplate: 'Selecciona Plantilla (opcional)',
    fullName: 'Nombre Completo',
    createPassword: 'Crea una contraseña',
    createAccount: 'Crear Cuenta y Aceptar',
    cancel: 'Cancelar',
    // Button states
    loading: 'Cargando...',
    saving: 'Guardando...',
    optional: 'Opcional',
    // Case Types
    familyLaw: 'Derecho de Familia',
    civil: 'Civil',
    compliance: 'Cumplimiento/Formularios',
    criminalDefense: 'Defensa Criminal',
    other: 'Otro',
    general: 'Derecho General',
    // Case Management
    archive: 'Archivar',
    delete: 'Eliminar',
    restore: 'Restaurar',
    deletePermanently: 'Eliminar Permanentemente',
    deleteConfirm: '¿Estás seguro? Esto no se puede deshacer.',
    archived: 'Archivado',
    showArchived: 'Mostrar Archivados',
    hideArchived: 'Ocultar Archivados',
    trash: 'Papelera',
    recovery: 'Recuperación',
    recover: 'Recuperar de la Papelera',
    recoveryWindow: 'Ventana de recuperación de 30 días',
    all: 'Todos',
    apply: 'Aplicar',
    ok: 'Aceptar',
    search: 'Buscar casos...',
    filter: 'Filtro',
    // Case Detail Screen
    caseInfo: 'Información del Caso',
    inProgress: 'En Progreso',
    closed: 'Cerrado',
    docket: 'Número de Expediente',
    yourLawyer: 'Tu Abogado',
    contactLawyer: 'Contactar Abogado',
    emailLawyer: 'Correo del Abogado',
    none: 'Ninguno',
    untitledCase: 'Caso sin Título',
    back: 'Atrás',
    contactYourLawyer: 'Contacta a tu Abogado',
    // Checklist Templates
    signRetainer: 'Firmar acuerdo de retención',
    gatherFinancial: 'Reunir documentos financieros',
    collectChildDocs: 'Recopilar documentación de custodia infantil',
    fileInitialPetition: 'Presentar petición inicial',
    serveSpouse: 'Notificar al cónyuge con documentos',
    attendMediation: 'Asistir a sesión de mediación',
    prepareSettlement: 'Preparar acuerdo de liquidación',
    completeAudit: 'Completar auditoría de cumplimiento',
    fileRequiredForms: 'Presentar formularios requeridos al gobierno',
    updatePrivacy: 'Actualizar política de privacidad',
    documentCompliance: 'Documentar procedimientos de cumplimiento',
    trainStaff: 'Capacitar al personal sobre requisitos',
    scheduleFollowUp: 'Programar auditoría de seguimiento',
    reviewPolice: 'Revisar informe policial',
    investigateArrest: 'Investigar circunstancias del arresto',
    fileDiscovery: 'Presentar mociones de descubrimiento',
    prepareDefense: 'Preparar estrategia de defensa',
    arrangeMeeting: 'Organizar reunión con cliente',
    prepareBail: 'Preparar argumentos de fianza/liberación',
  },
};

// 🌍 Global AppState - never in React state, survives all re-renders
const AppState = {
  language: 'en' as 'en' | 'es',
};

// Translation accessor function - always reads from AppState.language
const t = (key: string): string => {
  const keys = key.split('.');
  let value: any = TRANSLATIONS[AppState.language];

  for (const k of keys) {
    value = value[k];
    if (!value) return key;
  }

  return value || key;
};

// Get case types with translated labels
const getCaseTypes = () => [
  { value: 'Family Law', label: t('familyLaw') },
  { value: 'Civil', label: t('civil') },
  { value: 'Compliance/Forms', label: t('compliance') },
  { value: 'Criminal Defense', label: t('criminalDefense') },
  { value: 'Other', label: t('other') },
];

// Get checklist templates based on current language
const getChecklistTemplates = (): Record<string, string[]> => {
  const lang = AppState.language;

  if (lang === 'es') {
    return {
      'Family Law': [
        t('signRetainer'),
        t('gatherFinancial'),
        t('collectChildDocs'),
        t('fileInitialPetition'),
        t('serveSpouse'),
        t('attendMediation'),
        t('prepareSettlement'),
      ],
      'Compliance/Forms': [
        t('completeAudit'),
        t('fileRequiredForms'),
        t('updatePrivacy'),
        t('documentCompliance'),
        t('trainStaff'),
        t('scheduleFollowUp'),
      ],
      'Criminal Defense': [
        t('reviewPolice'),
        t('investigateArrest'),
        t('fileDiscovery'),
        t('prepareDefense'),
        t('arrangeMeeting'),
        t('prepareBail'),
      ],
    };
  }

  // English (default)
  return {
    'Family Law': [
      'Sign retainer agreement',
      'Gather financial documents',
      'Collect child custody documentation',
      'File initial petition',
      'Serve spouse with papers',
      'Attend mediation session',
      'Prepare settlement agreement',
    ],
    'Compliance/Forms': [
      'Complete compliance audit',
      'File required forms with government',
      'Update privacy policy',
      'Document compliance procedures',
      'Train staff on requirements',
      'Schedule follow-up audit',
    ],
    'Criminal Defense': [
      'Review police report',
      'Investigate arrest circumstances',
      'File discovery motions',
      'Prepare defense strategy',
      'Arrange client meeting',
      'Prepare bail/release arguments',
    ],
  };
};

// Get status color based on case status
const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'open':
      return '#22c55e';
    case 'in_progress':
      return '#3b82f6';
    case 'closed':
      return '#888888';
    case 'active':
      return '#22c55e';
    case 'archived':
      return '#888888';
    default:
      return '#0066cc';
  }
};

// Get translated status label
const getStatusLabel = (status: string): string => {
  const normalizedStatus = status?.toLowerCase() || 'active';
  switch (normalizedStatus) {
    case 'active':
      return t('active');
    case 'in_progress':
    case 'inprogress':
      return t('inProgress');
    case 'closed':
      return t('closed');
    case 'archived':
      return t('archived');
    default:
      return status;
  }
};

// Invite Client Modal Component
function InviteClientModal({
  visible,
  onClose,
  caseId,
  inviteEmail,
  setInviteEmail,
  onSendInvite,
  inviteLoading,
  inviteError,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  caseId: string;
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  onSendInvite: () => void;
  inviteLoading: boolean;
  inviteError: string;
  styles: any;
}) {
  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContent}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('inviteClient')}</Text>
              <TouchableOpacity onPress={handleDismissKeyboard}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('clientEmail')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('enterClientEmail')}
                  placeholderTextColor="#666666"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!inviteLoading}
                  returnKeyType="done"
                  onSubmitEditing={onSendInvite}
                />
              </View>

              {inviteError ? <Text style={styles.formError}>{inviteError}</Text> : null}

              <View style={styles.inviteButtonRow}>
                <TouchableOpacity
                  style={[styles.inviteCancelButton, inviteLoading && styles.inviteCancelButtonDisabled]}
                  onPress={handleDismissKeyboard}
                  disabled={inviteLoading}
                >
                  <Text style={styles.inviteCancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.inviteSendButton, inviteLoading && styles.inviteSendButtonDisabled]}
                  onPress={onSendInvite}
                  disabled={inviteLoading}
                >
                  {inviteLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.inviteSendButtonText}>{t('sendInvite')}</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// Case Detail Screen Component
function CaseDetailScreen({
  caseData,
  onBack,
  styles,
  userToken,
  showInviteModal,
  setShowInviteModal,
  inviteEmail,
  setInviteEmail,
  onSendInvite,
  inviteLoading,
  inviteError,
  messages,
  setMessages,
  newMessage,
  setNewMessage,
  messagesLoading,
  messagesSendingId,
  sendMessage,
  courtDates,
  setCourtDates,
  newDateLabel,
  setNewDateLabel,
  newDateValue,
  setNewDateValue,
  newDateSeverity,
  setNewDateSeverity,
  showAddDateModal,
  setShowAddDateModal,
  datesLoading,
  addCourtDate,
  caseDetailTab,
  setCaseDetailTab,
  deleteMessage,
  deleteCourtDate,
}: {
  caseData: any;
  onBack: () => void;
  styles: any;
  userToken: string | null;
  showInviteModal: boolean;
  setShowInviteModal: (show: boolean) => void;
  inviteEmail: string;
  setInviteEmail: (email: string) => void;
  onSendInvite: () => void;
  inviteLoading: boolean;
  inviteError: string;
  messages: any[];
  setMessages: (msgs: any[]) => void;
  newMessage: string;
  setNewMessage: (msg: string) => void;
  messagesLoading: boolean;
  messagesSendingId: string | null;
  sendMessage: (caseId: string) => void;
  courtDates: any[];
  setCourtDates: (dates: any[]) => void;
  newDateLabel: string;
  setNewDateLabel: (label: string) => void;
  newDateValue: string;
  setNewDateValue: (date: string) => void;
  newDateSeverity: 'low' | 'medium' | 'high';
  setNewDateSeverity: (severity: 'low' | 'medium' | 'high') => void;
  showAddDateModal: boolean;
  setShowAddDateModal: (show: boolean) => void;
  datesLoading: boolean;
  addCourtDate: (caseId: string) => void;
  caseDetailTab: 'checklist' | 'messages' | 'documents' | 'dates';
  setCaseDetailTab: (tab: 'checklist' | 'messages' | 'documents' | 'dates') => void;
  deleteMessage: (id: string) => void;
  deleteCourtDate: (id: string) => void;
}) {
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [showAddItemInput, setShowAddItemInput] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [addingItem, setAddingItem] = useState(false);

  // Date Picker State
  const [pickedDate, setPickedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState(pickedDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(pickedDate.getDate());
  const [selectedYear, setSelectedYear] = useState(pickedDate.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  // Message Settings State
  const [messagesEnabled, setMessagesEnabled] = useState(true);

  // Month names
  const monthNames = AppState.language === 'es'
    ? ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Load message settings from AsyncStorage
  useEffect(() => {
    if (!caseData?.id) return;

    const loadMessageSettings = async () => {
      try {
        const key = `case_${caseData.id}_messagesEnabled`;
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null) {
          setMessagesEnabled(JSON.parse(stored));
        } else {
          setMessagesEnabled(true); // Default to enabled
        }
      } catch (err) {
        console.error('Error loading message settings:', err);
      }
    };

    loadMessageSettings();
  }, [caseData?.id]);

  // Load checklist from database
  useEffect(() => {
    if (!caseData?.id || !userToken) return;

    const loadChecklist = async () => {
      try {
        setLoadingChecklist(true);
        const response = await fetch(
          `https://lawyerbuddy-production.up.railway.app/cases/${caseData.id}/checklist`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${userToken}`,
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          setChecklistItems(data.items || []);
          console.log('✅ Loaded checklist:', data.items);
        }
      } catch (err: any) {
        console.error('❌ Error loading checklist:', err.message);
      } finally {
        setLoadingChecklist(false);
      }
    };

    loadChecklist();
  }, [caseData?.id, userToken]);

  const handleAddChecklistItem = async () => {
    if (!newItemText.trim()) return;
    if (!caseData?.id || !userToken) {
      alert('Not authenticated or case not loaded');
      return;
    }

    try {
      setAddingItem(true);
      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/cases/${caseData.id}/checklist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            label: newItemText.trim(),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setChecklistItems([...checklistItems, data.item]);
        setNewItemText('');
        setShowAddItemInput(false);
        console.log('✅ Added checklist item:', data.item);
      } else {
        alert('Failed to add item: ' + data.error);
      }
    } catch (err: any) {
      alert('Error adding checklist item: ' + err.message);
      console.error('❌ Error adding checklist item:', err);
    } finally {
      setAddingItem(false);
    }
  };

  const toggleChecklistItem = async (item: any) => {
    if (!userToken) return;

    // Store original state for rollback
    const originalItem = item;
    const newIsComplete = !item.is_complete;

    // Optimistic update - update UI immediately using functional setState
    setChecklistItems(prevItems =>
      prevItems.map(i => i.id === item.id ? { ...i, is_complete: newIsComplete } : i)
    );
    console.log('✅ Toggled checklist item (optimistic):', item.id, newIsComplete);

    try {
      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/cases/${caseData.id}/checklist/${item.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            isComplete: newIsComplete,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Sync with server response using functional setState
        setChecklistItems(prevItems =>
          prevItems.map(i => i.id === item.id ? data.item : i)
        );
        console.log('✅ Checklist item confirmed by server:', data.item);
      } else {
        // Revert on API failure using functional setState
        setChecklistItems(prevItems =>
          prevItems.map(i => i.id === item.id ? originalItem : i)
        );
        alert('Failed to update checklist item');
      }
    } catch (err: any) {
      // Revert on network error using functional setState
      setChecklistItems(prevItems =>
        prevItems.map(i => i.id === item.id ? originalItem : i)
      );
      console.error('❌ Error toggling checklist item:', err);
      alert('Error updating checklist item');
    }
  };

  const deleteChecklistItem = async (itemId: string) => {
    if (!userToken || !caseData?.id) return;

    try {
      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/cases/${caseData.id}/checklist/${itemId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success || response.ok) {
        console.log('✅ Checklist item deleted:', itemId);
        setChecklistItems(prev => prev.filter(i => i.id !== itemId));
      } else {
        console.error('❌ Delete failed:', data);
      }
    } catch (err: any) {
      console.error('❌ Error deleting checklist item:', err);
    }
  };

  // Guard against null/undefined caseData
  if (!caseData) {
    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>Case Not Found</Text>
          <View style={{ width: 60 }} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>← {t('back')}</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>{caseData?.title || t('untitledCase')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        {/* Case Information */}
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>{t('caseInfo')}</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('caseType')}:</Text>
            <Text style={styles.detailValue}>{caseData?.case_type || t('general')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('status')}:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(caseData?.status || 'active') }]}>
              {getStatusLabel(caseData?.status || 'active')}
            </Text>
          </View>

          {caseData?.docket_number && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('docket')}:</Text>
              <Text style={styles.detailValue}>{caseData.docket_number}</Text>
            </View>
          )}

          {caseData?.client_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('client')}:</Text>
              <Text style={styles.detailValue}>{caseData.client_name}</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.detailTabs}
          contentContainerStyle={{ gap: 8 }}
        >
          {['checklist', 'messages', 'documents', 'dates'].map((tab: any) => (
            <TouchableOpacity
              key={tab}
              style={[styles.detailTab, caseDetailTab === tab && styles.detailTabActive]}
              onPress={() => {
                setCaseDetailTab(tab as any);
                // Load messages on demand
                if (tab === 'messages' && messages.length === 0 && userToken && caseData?.id) {
                  fetch(
                    `https://lawyerbuddy-production.up.railway.app/messages/${caseData.id}`,
                    {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${userToken}`,
                      },
                    }
                  )
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.success) setMessages(d.messages || []);
                    })
                    .catch((e) => console.error('Error loading messages:', e));
                }
                // Load court dates on demand
                if (tab === 'dates' && courtDates.length === 0 && userToken && caseData?.id) {
                  fetch(
                    `https://lawyerbuddy-production.up.railway.app/events/${caseData.id}`,
                    {
                      method: 'GET',
                      headers: {
                        'Authorization': `Bearer ${userToken}`,
                      },
                    }
                  )
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.success) {
                        const dates = (d.events || [])
                          .filter((e: any) => e.event_type === 'deadline')
                          .sort((a: any, b: any) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
                        setCourtDates(dates);
                      }
                    })
                    .catch((e) => console.error('Error loading dates:', e));
                }
              }}
            >
              <Text style={[styles.detailTabText, caseDetailTab === tab && styles.detailTabTextActive]}>
                {tab === 'checklist' && `✓ ${t('checklist')}`}
                {tab === 'messages' && `💬 ${t('messages')}`}
                {tab === 'documents' && `📄 ${t('documents')}`}
                {tab === 'dates' && `📅 ${t('keyDates')}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Checklist Section */}
        {caseDetailTab === 'checklist' && (
        <View style={styles.detailSection}>
          <View style={styles.checklistHeader}>
            <Text style={styles.detailSectionTitle}>{t('checklist')}</Text>
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => {
                setShowAddItemInput(!showAddItemInput);
                setNewItemText('');
              }}
            >
              <Text style={styles.addItemButtonText}>{showAddItemInput ? `✕ ${t('cancel')}` : `+ ${t('addItem')}`}</Text>
            </TouchableOpacity>
          </View>

          {showAddItemInput && (
            <View style={styles.addItemInputContainer}>
              <TextInput
                style={styles.addItemInput}
                placeholder={t('addItem')}
                placeholderTextColor="#666666"
                value={newItemText}
                onChangeText={setNewItemText}
                autoFocus
              />
              <TouchableOpacity
                style={styles.addItemConfirmButton}
                onPress={handleAddChecklistItem}
              >
                <Text style={styles.addItemConfirmButtonText}>{t('addItem')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {loadingChecklist ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator color="#0066cc" size="large" />
              <Text style={{ color: '#888888', marginTop: 12 }}>{t('loading')}...</Text>
            </View>
          ) : checklistItems.length === 0 && !showAddItemInput ? (
            <Text style={styles.emptyChecklistText}>{t('noItems')}</Text>
          ) : (
            checklistItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistItem}
                onPress={() => toggleChecklistItem(item)}
                onLongPress={() => {
                  Alert.alert(t('delete'), 'Delete this item?', [
                    { text: t('cancel'), style: 'cancel' },
                    {
                      text: t('delete'),
                      onPress: () => deleteChecklistItem(item.id),
                      style: 'destructive',
                    },
                  ]);
                }}
                disabled={addingItem}
                delayLongPress={500}
              >
                <View style={styles.checklistCheckbox}>
                  {item.is_complete && (
                    <Text style={styles.checklistCheckmark}>✓</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.checklistItemText,
                    item.is_complete && styles.checklistItemCompleted,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
        )}

        {/* Messages Section */}
        {caseDetailTab === 'messages' && (
        <View style={styles.detailSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={styles.detailSectionTitle}>{t('messages')}</Text>
            <TouchableOpacity
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: messagesEnabled ? '#22c55e' : '#555555',
              }}
              onPress={async () => {
                const newState = !messagesEnabled;
                setMessagesEnabled(newState);
                try {
                  const key = `case_${caseData.id}_messagesEnabled`;
                  await AsyncStorage.setItem(key, JSON.stringify(newState));
                  console.log('✅ Message settings saved:', newState);
                } catch (err) {
                  console.error('Error saving message settings:', err);
                }
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>
                {messagesEnabled ? '✓ Enabled' : 'Disabled'}
              </Text>
            </TouchableOpacity>
          </View>
          {messagesLoading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator color="#0066cc" size="large" />
            </View>
          ) : messages.length === 0 ? (
            <Text style={{ color: '#888888', marginLeft: 16 }}>{t('noMessages')}</Text>
          ) : (
            messages.map((msg: any) => {
              try {
                const decodedContent = msg.content_encrypted ? atob(msg.content_encrypted) : msg.content || '';
                return (
                  <TouchableOpacity
                    key={msg.id}
                    style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#333333' }}
                    onLongPress={() => {
                      Alert.alert(t('delete'), 'Delete this message?', [
                        { text: t('cancel'), style: 'cancel' },
                        {
                          text: t('delete'),
                          onPress: () => deleteMessage(msg.id),
                          style: 'destructive',
                        },
                      ]);
                    }}
                  >
                    <Text style={{ color: '#888888', fontSize: 12 }}>{new Date(msg.created_at).toLocaleDateString()}</Text>
                    <Text style={{ color: '#ffffff', marginTop: 4 }}>{decodedContent}</Text>
                  </TouchableOpacity>
                );
              } catch (e) {
                return (
                  <TouchableOpacity
                    key={msg.id}
                    style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#333333' }}
                    onLongPress={() => {
                      Alert.alert(t('delete'), 'Delete this message?', [
                        { text: t('cancel'), style: 'cancel' },
                        {
                          text: t('delete'),
                          onPress: () => deleteMessage(msg.id),
                          style: 'destructive',
                        },
                      ]);
                    }}
                  >
                    <Text style={{ color: '#888888', fontSize: 12 }}>{new Date(msg.created_at).toLocaleDateString()}</Text>
                    <Text style={{ color: '#ff4444' }}>[Error decoding message]</Text>
                  </TouchableOpacity>
                );
              }
            })
          )}

          {messagesEnabled ? (
            <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={{ flex: 1, borderWidth: 1, borderColor: '#333333', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', backgroundColor: '#0a0a0a' }}
                placeholder={t('typeMessage')}
                placeholderTextColor="#666666"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity
                style={{ backgroundColor: '#0066cc', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' }}
                onPress={() => sendMessage(caseData?.id)}
                disabled={!!messagesSendingId}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>{t('sendMessage')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#1a1a1a', borderRadius: 8, marginHorizontal: 16, marginBottom: 8 }}>
              <Text style={{ color: '#888888', textAlign: 'center' }}>Messages are disabled for this case</Text>
            </View>
          )}
        </View>
        )}

        {/* Documents Section */}
        {caseDetailTab === 'documents' && (
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>{t('documents')}</Text>
          <Text style={{ color: '#888888', marginLeft: 16, marginTop: 8 }}>{t('noDocuments')}</Text>
        </View>
        )}

        {/* Court Dates Section */}
        {caseDetailTab === 'dates' && (
        <View style={styles.detailSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={styles.detailSectionTitle}>{t('courtDates')}</Text>
            <TouchableOpacity
              style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#22c55e', borderRadius: 6 }}
              onPress={() => setShowAddDateModal(!showAddDateModal)}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 12 }}>+ {t('addDate')}</Text>
            </TouchableOpacity>
          </View>

          {showAddDateModal && (
            <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1a1a1a', borderRadius: 8, marginBottom: 16 }}>
              {/* Date Label Input */}
              <TextInput
                style={{ borderWidth: 1, borderColor: '#333333', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#ffffff', backgroundColor: '#0a0a0a', marginBottom: 12 }}
                placeholder={t('dateLabel')}
                placeholderTextColor="#666666"
                value={newDateLabel}
                onChangeText={setNewDateLabel}
              />

              {/* Month Picker */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#888888', fontSize: 12, marginBottom: 6 }}>{AppState.language === 'es' ? 'Mes' : 'Month'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {monthNames.map((month, idx) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#333333' },
                          selectedMonth === idx && { backgroundColor: '#0066cc', borderColor: '#0066cc' },
                        ]}
                        onPress={() => setSelectedMonth(idx)}
                      >
                        <Text style={[{ fontSize: 12, color: '#888888' }, selectedMonth === idx && { color: '#ffffff' }]}>
                          {month.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Day Picker */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#888888', fontSize: 12, marginBottom: 6 }}>{AppState.language === 'es' ? 'Día' : 'Day'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#333333' },
                          selectedDay === day && { backgroundColor: '#0066cc', borderColor: '#0066cc' },
                        ]}
                        onPress={() => setSelectedDay(day)}
                      >
                        <Text style={[{ fontSize: 12, color: '#888888' }, selectedDay === day && { color: '#ffffff' }]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#888888', fontSize: 12, marginBottom: 6 }}>{AppState.language === 'es' ? 'Año' : 'Year'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {[2026, 2027, 2028].map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#333333' },
                          selectedYear === year && { backgroundColor: '#0066cc', borderColor: '#0066cc' },
                        ]}
                        onPress={() => setSelectedYear(year)}
                      >
                        <Text style={[{ fontSize: 12, color: '#888888' }, selectedYear === year && { color: '#ffffff' }]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Selected Date Display */}
              <View style={{ backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333333', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12 }}>
                <Text style={{ color: '#888888', fontSize: 12, marginBottom: 4 }}>{AppState.language === 'es' ? 'Fecha Seleccionada' : 'Selected Date'}</Text>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  {monthNames[selectedMonth]} {selectedDay}, {selectedYear}
                </Text>
              </View>

              {/* Add Date Button */}
              <TouchableOpacity
                style={{ backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
                onPress={() => {
                  const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
                  setPickedDate(selectedDate);
                  setNewDateValue(selectedDate.toISOString().split('T')[0]);
                  addCourtDate(caseData?.id);
                  console.log('📅 Date added:', selectedDate.toISOString().split('T')[0]);
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600' }}>{t('addDate')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {datesLoading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator color="#0066cc" size="large" />
            </View>
          ) : courtDates.length === 0 ? (
            <Text style={{ color: '#888888', marginLeft: 16 }}>{t('noDates')}</Text>
          ) : (
            courtDates.map((date: any) => {
              const dateObj = new Date(date.occurred_at);
              const isUpcoming = dateObj > new Date();
              const bgColor = isUpcoming ? '#22c55e20' : '#66666620';
              const borderColor = isUpcoming ? '#22c55e' : '#666666';
              return (
                <TouchableOpacity
                  key={date.id}
                  style={{ paddingVertical: 12, paddingHorizontal: 16, backgroundColor: bgColor, borderLeftWidth: 4, borderLeftColor: borderColor, marginBottom: 8, borderRadius: 4 }}
                  onLongPress={() => {
                    Alert.alert(t('delete'), 'Delete this date?', [
                      { text: t('cancel'), style: 'cancel' },
                      {
                        text: t('delete'),
                        onPress: () => deleteCourtDate(date.id),
                        style: 'destructive',
                      },
                    ]);
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '600', marginBottom: 4 }}>{date.title}</Text>
                  <Text style={{ color: '#888888', fontSize: 12 }}>
                    {dateObj.toLocaleDateString(AppState.language === 'es' ? 'es-ES' : 'en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                  <Text style={{ color: isUpcoming ? '#22c55e' : '#666666', fontSize: 11, marginTop: 4 }}>
                    {isUpcoming ? `📅 ${t('upcoming')}` : `✓ ${t('past')}`}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Invite Client Modal */}
      <InviteClientModal
        visible={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteEmail('');
        }}
        caseId={caseData?.id || ''}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        onSendInvite={onSendInvite}
        inviteLoading={inviteLoading}
        inviteError={inviteError}
        styles={styles}
      />

        {/* Invite Client Button */}
        <View style={styles.detailBottomButton}>
          <TouchableOpacity
            style={styles.inviteButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Text style={styles.inviteButtonText}>{t('inviteClient')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Client Portal Screen Component
function ClientPortalScreen({
  caseData,
  userToken,
  onLogout,
  styles,
}: {
  caseData: any;
  userToken: string | null;
  onLogout: () => void;
  styles: any;
}) {
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(true);

  // Load checklist when case is selected
  useEffect(() => {
    if (!caseData?.id || !userToken) return;

    const loadChecklist = async () => {
      try {
        setLoadingChecklist(true);
        const response = await fetch(
          `https://lawyerbuddy-production.up.railway.app/cases/${caseData.id}/checklist`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${userToken}`,
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          setChecklistItems(data.items || []);
        }
      } catch (err: any) {
        console.error('Error loading checklist:', err);
      } finally {
        setLoadingChecklist(false);
      }
    };

    loadChecklist();
  }, [caseData?.id, userToken]);

  if (!caseData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('myCases')}</Text>
          <TouchableOpacity onPress={onLogout}>
            <Text style={styles.logoutButton}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#888888', fontSize: 16 }}>{t('noCase')}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t('myCase')}</Text>
            <Text style={styles.subtitle}>{caseData.title}</Text>
          </View>
          <TouchableOpacity onPress={onLogout}>
            <Text style={styles.logoutButton}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Case Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('caseInfo')}</Text>
            <View style={{ paddingLeft: 16 }}>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#888888', fontSize: 12 }}>{t('caseType')}</Text>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  {caseData.case_type}
                </Text>
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#888888', fontSize: 12 }}>{t('status')}</Text>
                <Text style={{ color: getStatusColor(caseData.status || 'active'), fontSize: 16, fontWeight: '600' }}>
                  {getStatusLabel(caseData.status || 'active')}
                </Text>
              </View>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#888888', fontSize: 12 }}>{t('yourLawyer')}</Text>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  {caseData.lawyer?.full_name || t('none')}
                </Text>
              </View>
              <View>
                <Text style={{ color: '#888888', fontSize: 12 }}>{t('created')}</Text>
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                  {new Date(caseData.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Checklist */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Checklist</Text>

            {loadingChecklist ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator color="#0066cc" size="large" />
              </View>
            ) : checklistItems.length === 0 ? (
              <Text style={{ color: '#888888', marginLeft: 16, marginTop: 8 }}>
                No items yet
              </Text>
            ) : (
              checklistItems.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: 'row',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: '#1a1a1a',
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderWidth: 2,
                      borderColor: item.is_complete ? '#22c55e' : '#0066cc',
                      borderRadius: 4,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#0a0a0a',
                      marginRight: 12,
                    }}
                  >
                    {item.is_complete && <Text style={{ color: '#22c55e', fontSize: 14 }}>✓</Text>}
                  </View>
                  <Text
                    style={{
                      color: item.is_complete ? '#666666' : '#ffffff',
                      textDecorationLine: item.is_complete ? 'line-through' : 'none',
                      flex: 1,
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* Contact Lawyer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('contactYourLawyer')}</Text>
            <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#0066cc',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
                onPress={() => {
                  const email = caseData.lawyer?.email;
                  if (email) {
                    alert(`${t('emailLawyer')}: ${email}`);
                  }
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                  📧 {t('emailLawyer')}
                </Text>
              </TouchableOpacity>
              {caseData.lawyer?.email && (
                <Text style={{ color: '#888888', fontSize: 12, textAlign: 'center' }}>
                  {caseData.lawyer.email}
                </Text>
              )}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Separate New Case Modal Component
function NewCaseModal({
  visible,
  onClose,
  onCreateCase,
  newCaseTitle,
  setNewCaseTitle,
  newCaseType,
  setNewCaseType,
  newCaseDocket,
  setNewCaseDocket,
  newCaseLoading,
  newCaseError,
  styles,
  selectedTemplate,
  setSelectedTemplate,
  suggestedCaseTypes = [],
}: {
  visible: boolean;
  onClose: () => void;
  onCreateCase: () => void;
  newCaseTitle: string;
  setNewCaseTitle: (title: string) => void;
  newCaseType: string;
  setNewCaseType: (type: string) => void;
  newCaseDocket: string;
  setNewCaseDocket: (docket: string) => void;
  newCaseLoading: boolean;
  newCaseError: string;
  styles: any;
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
  suggestedCaseTypes?: string[];
}) {
  const [showCaseTypeSuggestions, setShowCaseTypeSuggestions] = useState(false);

  // Filter suggestions based on current input
  const filteredSuggestions = newCaseType
    ? suggestedCaseTypes.filter(type =>
        type.toLowerCase().includes(newCaseType.toLowerCase()) &&
        type.toLowerCase() !== newCaseType.toLowerCase()
      )
    : suggestedCaseTypes;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('newCaseTitle')}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalForm}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            {/* Case Title */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('newCase')} *</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('caseTitlePlaceholder')}
                placeholderTextColor="#666666"
                value={newCaseTitle}
                onChangeText={setNewCaseTitle}
                editable={!newCaseLoading}
                autoFocus={false}
              />
            </View>

            {/* Case Type - Free Text Input with Autocomplete */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('caseType')} *</Text>
              <View>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('caseTypePlaceholder')}
                  placeholderTextColor="#555555"
                  value={newCaseType}
                  onChangeText={(text) => {
                    setNewCaseType(text);
                    setShowCaseTypeSuggestions(text.length > 0);
                  }}
                  onFocus={() => setShowCaseTypeSuggestions(newCaseType.length > 0)}
                  onBlur={() => setTimeout(() => setShowCaseTypeSuggestions(false), 200)}
                  editable={!newCaseLoading}
                  autoCapitalize="words"
                />

                {/* Autocomplete Suggestions */}
                {showCaseTypeSuggestions && filteredSuggestions.length > 0 && (
                  <View style={{ backgroundColor: '#1a1a1a', borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#333333' }}>
                    {filteredSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderBottomWidth: index < filteredSuggestions.length - 1 ? 1 : 0,
                          borderBottomColor: '#333333',
                        }}
                        onPress={() => {
                          setNewCaseType(suggestion);
                          setShowCaseTypeSuggestions(false);
                        }}
                      >
                        <Text style={{ color: '#0066cc', fontSize: 14 }}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Note: Template selection (pre-made templates) has been removed.
                Users can now create custom case setups and save them as templates after case creation. */}

            {/* Docket Number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('docketNumber')} ({t('optional')})</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('docketNumber')}
                placeholderTextColor="#666666"
                value={newCaseDocket}
                onChangeText={setNewCaseDocket}
                editable={!newCaseLoading}
                autoFocus={false}
              />
              <Text style={{ color: '#888888', fontSize: 12, marginTop: 6 }}>
                {t('docketInfo')}
              </Text>
            </View>

            {/* Error Message */}
            {newCaseError ? <Text style={styles.formError}>{newCaseError}</Text> : null}

            {/* Button Row */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              {/* Cancel Button */}
              <TouchableOpacity
                style={[
                  styles.createButton,
                  { flex: 1, backgroundColor: '#666666' },
                  newCaseLoading && styles.createButtonDisabled,
                ]}
                onPress={onClose}
                disabled={newCaseLoading}
              >
                <Text style={styles.createButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>

              {/* Create Button */}
              <TouchableOpacity
                style={[styles.createButton, { flex: 1 }, newCaseLoading && styles.createButtonDisabled]}
                onPress={onCreateCase}
                disabled={newCaseLoading}
              >
                {newCaseLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.createButtonText}>{t('createCase')}</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Accept Invite Screen
function AcceptInviteScreen({
  inviteToken,
  onClose,
  onSuccess,
  styles,
}: {
  inviteToken: string;
  onClose: () => void;
  onSuccess?: (token: string, userData: any) => void;
  styles: any;
}) {
  const [fullName, setFullName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    validateInvite();
  }, []);

  const validateInvite = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/auth/invite/${inviteToken}`,
        { method: 'GET' }
      );
      const data = await response.json();

      if (data.success) {
        setInviteData(data);
        console.log('✅ Invite valid:', data);
      } else {
        setError(data.error || 'Invalid invite');
      }
    } catch (err: any) {
      setError('Failed to validate invite: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!fullName.trim() || !invitePassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setAccepting(true);

    try {
      const response = await fetch(
        'https://lawyerbuddy-production.up.railway.app/auth/invite/accept',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: inviteToken,
            email: inviteData.invitedEmail,
            password: invitePassword,
            fullName,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Save token
        await AsyncStorage.setItem('userToken', data.accessToken);

        // Auto-login the user
        const userData = {
          full_name: data.profile?.full_name || fullName,
          role: data.profile?.role || 'client',
        };

        console.log('✅ Account created! Auto-logging in...');

        // Call success callback to auto-login
        if (onSuccess) {
          onSuccess(data.accessToken, userData);
        }

        onClose();
      } else {
        setError(data.error || 'Failed to accept invite');
      }
    } catch (err: any) {
      setError('Error: ' + err.message);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={{ color: '#888888', marginTop: 16 }}>{t('loading')}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !inviteData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text style={{ color: '#ff4444', fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>
            ❌ {error}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#0066cc', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            onPress={onClose}
          >
            <Text style={{ color: '#ffffff', fontWeight: '600' }}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 24, paddingVertical: 40, flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#ffffff', marginBottom: 8 }}>
              {t('acceptInvite')}
            </Text>
            <Text style={{ fontSize: 16, color: '#888888', marginBottom: 32 }}>
              {inviteData?.lawyerName} invited you to join their case
            </Text>

            <View style={{ backgroundColor: '#0066cc', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, marginBottom: 32 }}>
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                Case: {inviteData?.caseTitle}
              </Text>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#888888', fontSize: 12, marginBottom: 8 }}>{t('fullName')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('fullName')}
                placeholderTextColor="#666666"
                value={fullName}
                onChangeText={setFullName}
                editable={!accepting}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#888888', fontSize: 12, marginBottom: 8 }}>{t('password')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('createPassword')}
                placeholderTextColor="#666666"
                value={invitePassword}
                onChangeText={setInvitePassword}
                secureTextEntry
                editable={!accepting}
              />
            </View>

            {error && <Text style={{ color: '#ff4444', marginBottom: 16 }}>❌ {error}</Text>}

            <TouchableOpacity
              style={{ backgroundColor: '#22c55e', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 }}
              onPress={handleAcceptInvite}
              disabled={accepting}
            >
              {accepting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>{t('createAccount')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ paddingVertical: 12, alignItems: 'center' }}
              onPress={onClose}
              disabled={accepting}
            >
              <Text style={{ color: '#0066cc', fontWeight: '600' }}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  // Force re-render trigger for global AppState changes (language, etc)
  const [, forceUpdate] = useState(0);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<{ full_name: string; role: string } | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [checklistProgress, setChecklistProgress] = useState<Record<string, { total: number; completed: number }>>({});
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // New Case Form State
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseType, setNewCaseType] = useState('');
  const [newCaseDocket, setNewCaseDocket] = useState('');
  const [newCaseLoading, setNewCaseLoading] = useState(false);
  const [newCaseError, setNewCaseError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Case Detail State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Case List Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'trash'>('active');

  // Invite Client Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Deep Link State for Invites
  const [currentInviteToken, setCurrentInviteToken] = useState<string | null>(null);

  // Messages State
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messagesSendingId, setMessagesSendingId] = useState<string | null>(null);

  // Documents State
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Court Dates/Deadlines State
  const [courtDates, setCourtDates] = useState<any[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [newDateLabel, setNewDateLabel] = useState('');
  const [newDateValue, setNewDateValue] = useState('');
  const [newDateSeverity, setNewDateSeverity] = useState<'low' | 'medium' | 'high'>('medium');

  // Tab State for Case Detail
  const [caseDetailTab, setCaseDetailTab] = useState<'checklist' | 'messages' | 'documents' | 'dates'>('checklist');

  // Multi-select Cases State
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());

  // Case Template State
  const [showSaveTemplateAlert, setShowSaveTemplateAlert] = useState(false);
  const [templateBeingSaved, setTemplateBeingSaved] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<Record<string, any[]>>({});

  // Load language preference and saved email on app startup
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // Load language
        const savedLang = await AsyncStorage.getItem('appLanguage');
        if (savedLang === 'es' || savedLang === 'en') {
          AppState.language = savedLang;
          forceUpdate(n => n + 1); // Trigger re-render with loaded language
          console.log(`✅ Loaded language preference: ${savedLang.toUpperCase()}`);
        }

        // Load saved email if remember email was checked
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberEmail(true);
          console.log('✅ Loaded saved email');
        }

        // Load case templates from AsyncStorage
        const templatesJson = await AsyncStorage.getItem('caseTemplates');
        if (templatesJson) {
          const templates = JSON.parse(templatesJson);
          setSavedTemplates(templates);
          console.log('✅ Loaded case templates:', Object.keys(templates).length);
        }
      } catch (err) {
        console.error('Error loading stored data:', err);
      }
    };
    loadStoredData();
  }, []);

  useEffect(() => {
    if (success && userData) {
      fetchCases();
    }
  }, [success, userData]);

  // Deep Link Handler for Invites
  useEffect(() => {
    // Handle deep link when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Deep link received:', url);
      const token = parseInviteToken(url);
      if (token) {
        console.log('✅ Invite token extracted:', token);
        setCurrentInviteToken(token);
      }
    });

    // Check for deep link when app launches
    Linking.getInitialURL().then((url) => {
      if (url != null) {
        console.log('🔗 Initial deep link:', url);
        const token = parseInviteToken(url);
        if (token) {
          console.log('✅ Initial invite token extracted:', token);
          setCurrentInviteToken(token);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const fetchCases = async (tokenOverride?: string) => {
    try {
      setCasesLoading(true);
      const token = tokenOverride || (await AsyncStorage.getItem('userToken'));
      setUserToken(token);

      if (!token) {
        console.error('❌ No token found for fetching cases');
        setCases([]);
        return;
      }

      console.log('📥 Fetching cases with token...');
      const response = await fetch('https://lawyerbuddy-production.up.railway.app/cases', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📦 Cases response:', data);

      if (response.ok && data.cases) {
        setCases(data.cases);
        console.log('✅ Cases loaded successfully');

        // Load checklist progress for each case
        if (token) {
          loadChecklistProgress(data.cases, token);
        }
      } else {
        console.error('❌ Failed to fetch cases:', data);
        setCases([]);
      }
    } catch (err: any) {
      console.error('❌ Error fetching cases:', err);
      setCases([]);
    } finally {
      setCasesLoading(false);
    }
  };

  const loadChecklistProgress = async (casesToLoad: any[], token: string) => {
    const progress: Record<string, { total: number; completed: number }> = {};

    for (const caseItem of casesToLoad) {
      try {
        const response = await fetch(
          `https://lawyerbuddy-production.up.railway.app/cases/${caseItem.id}/checklist`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (data.success && data.items) {
          const items = data.items;
          const completed = items.filter((item: any) => item.is_complete).length;
          progress[caseItem.id] = {
            total: items.length,
            completed: completed,
          };
          console.log(`✅ Loaded checklist for case ${caseItem.id}: ${completed}/${items.length}`);
        }
      } catch (err: any) {
        console.error(`⚠️  Failed to load checklist for case ${caseItem.id}:`, err);
      }
    }

    setChecklistProgress(progress);
  };

  const loadMessages = async (caseId: string, token: string) => {
    try {
      setMessagesLoading(true);
      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/messages/${caseId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        console.log(`✅ Loaded ${data.messages?.length || 0} messages`);
      }
    } catch (err: any) {
      console.error('Error loading messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadCourtDates = async (caseId: string, token: string) => {
    try {
      setDatesLoading(true);
      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/events/${caseId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        const deadlines = (data.events || [])
          .filter((e: any) => e.event_type === 'deadline')
          .sort((a: any, b: any) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
        setCourtDates(deadlines);
        console.log(`✅ Loaded ${deadlines.length} court dates`);
      }
    } catch (err: any) {
      console.error('Error loading court dates:', err);
    } finally {
      setDatesLoading(false);
    }
  };

  const sendMessage = async (caseId: string) => {
    if (!newMessage.trim() || !userToken) return;

    setMessagesSendingId('pending');
    try {
      const requestBody = {
        caseId,
        content_encrypted: btoa(newMessage.trim()),
      };

      console.log('📤 Sending message request:', JSON.stringify(requestBody, null, 2));
      console.log('🔐 Auth token:', userToken.substring(0, 20) + '...');

      const response = await fetch(
        'https://lawyerbuddy-production.up.railway.app/messages',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('📥 API response status:', response.status, response.statusText);

      const data = await response.json();
      console.log('📥 API response body:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log('✅ Message sent successfully');
        console.log('📨 New message object:', JSON.stringify(data.message, null, 2));

        // Optimistic update using functional setState to avoid closure issues
        setMessages(prev => {
          const updated = [...prev, data.message];
          console.log('📊 Messages list updated. Total messages:', updated.length);
          return updated;
        });

        // Clear input immediately
        setNewMessage('');
        console.log('🧹 Message input cleared');
      } else {
        console.warn('⚠️ API returned success: false', data);
      }
    } catch (err: any) {
      console.error('❌ Error sending message:', err.message);
      console.error('❌ Full error:', err);
    } finally {
      setMessagesSendingId(null);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!userToken) return;

    try {
      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success || response.ok) {
        console.log('✅ Message deleted:', messageId);
        setMessages(prev => prev.filter(m => m.id !== messageId));
      } else {
        console.error('❌ Delete failed:', data);
      }
    } catch (err: any) {
      console.error('❌ Error deleting message:', err);
    }
  };

  const deleteCourtDate = async (dateId: string) => {
    if (!userToken) return;

    try {
      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/events/${dateId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success || response.ok) {
        console.log('✅ Court date deleted:', dateId);
        setCourtDates(prev => prev.filter(d => d.id !== dateId));
      } else {
        console.error('❌ Delete failed:', data);
      }
    } catch (err: any) {
      console.error('❌ Error deleting court date:', err);
    }
  };

  const addCourtDate = async (caseId: string) => {
    if (!newDateLabel.trim() || !newDateValue || !userToken) return;

    try {
      const response = await fetch(
        'https://lawyerbuddy-production.up.railway.app/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            caseId,
            title: newDateLabel,
            eventType: 'deadline',
            occurredAt: new Date(newDateValue).toISOString(),
            narrative: newDateLabel,
            severity: newDateSeverity,
            privacyLevel: 'shared_with_lawyer',
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setCourtDates([...courtDates, data.event].sort((a, b) =>
          new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
        ));
        setNewDateLabel('');
        setNewDateValue('');
        setShowAddDateModal(false);
        console.log('✅ Court date added');
      }
    } catch (err: any) {
      console.error('Error adding court date:', err);
    }
  };

  const handleCreateCase = async () => {
    setNewCaseError('');

    // Validate inputs
    if (!newCaseTitle.trim()) {
      setNewCaseError('Case title is required');
      return;
    }

    setNewCaseLoading(true);
    const caseTitle = newCaseTitle; // Store for alert after reset

    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('📋 Retrieved token from AsyncStorage:', token ? `Token exists (${token.length} chars)` : '❌ NO TOKEN');

      if (!token) {
        setNewCaseError('Not authenticated - please log in again');
        setNewCaseLoading(false);
        return;
      }

      const caseData = {
        title: newCaseTitle,
        caseType: newCaseType,
        docketNumber: newCaseDocket || undefined,
      };

      console.log('📤 Creating case with data:', JSON.stringify(caseData, null, 2));
      console.log('🔗 POST URL: https://lawyerbuddy-production.up.railway.app/cases');
      console.log('🔐 Auth header: Bearer', token.substring(0, 30) + '...');

      const response = await fetch('https://lawyerbuddy-production.up.railway.app/cases', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData),
      });

      const data = await response.json();
      console.log('📥 Response status:', response.status);
      console.log('📥 Response body:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        console.log('✅ Case created successfully:', data.case);

        const newCaseId = data.case.id;
        const caseType = newCaseType;

        // Check if there's a saved template for this case type
        const template = savedTemplates[caseType];
        if (template && template.length > 0) {
          Alert.alert(
            'Apply Template?',
            `Apply "${caseType}" template with ${template.length} checklist items?`,
            [
              {
                text: t('cancel'),
                onPress: () => {
                  console.log('Template not applied');
                },
              },
              {
                text: 'Apply',
                onPress: async () => {
                  // Apply template by adding items to the case
                  try {
                    const token = await AsyncStorage.getItem('userToken');
                    if (!token) return;

                    // Add each template item to the case
                    for (let i = 0; i < template.length; i++) {
                      const item = template[i];
                      await fetch(`https://lawyerbuddy-production.up.railway.app/cases/${newCaseId}/checklist`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          label: item.label || item,
                          orderIndex: i,
                        }),
                      });
                    }
                    console.log('✅ Template applied:', caseType);
                  } catch (err) {
                    console.error('❌ Error applying template:', err);
                  }
                },
              },
            ]
          );
        }

        // Reset form and dismiss modal
        setNewCaseTitle('');
        setNewCaseType('');
        setNewCaseDocket('');
        setShowNewCaseForm(false);

        // Show success alert
        alert(`✅ Case "${caseTitle}" created successfully!`);

        // Refresh cases list
        await fetchCases();
      } else {
        const errorMessage = data.error || data.message || 'Failed to create case';
        console.error('❌ Case creation error:', errorMessage);
        setNewCaseError(errorMessage);
      }
    } catch (err: any) {
      console.error('❌ Network error creating case:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      setNewCaseError('Network error: ' + err.message);
    } finally {
      setNewCaseLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setSuccess(false);

    // Validate inputs
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);

    console.log('Attempting login to:', 'https://lawyerbuddy-production.up.railway.app/auth/login');

    try {
      const response = await fetch('https://lawyerbuddy-production.up.railway.app/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      console.log('Login response data:', JSON.stringify(data?.profile, null, 2));
      console.log('Full response:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Extract role and name with null safety
      // Use only profile.role (app role: 'client' or 'lawyer'), NOT user.role (Supabase JWT role: 'authenticated')
      const role = data?.profile?.role || 'lawyer';
      const name = (data?.profile?.full_name || data?.user?.email || 'User').trim();

      console.log('Role extracted:', role);
      console.log('Name extracted:', name);
      console.log('Profile object:', data?.profile);

      // Validate name is not empty
      if (!name || name === '') {
        setError('Invalid user data received from server');
        setLoading(false);
        return;
      }

      // Store token and role
      await AsyncStorage.setItem('userToken', data.session.access_token);
      await AsyncStorage.setItem('userRole', role);

      // Save or clear email based on remember email checkbox
      if (rememberEmail) {
        await AsyncStorage.setItem('savedEmail', email);
      } else {
        await AsyncStorage.removeItem('savedEmail');
      }

      // Set success state
      setUserData({
        full_name: name,
        role: role,
      });
      setUserRole(role);
      setUserToken(data.session.access_token);
      setSuccess(true);
      setPassword('');
    } catch (error: any) {
      console.error('Network error:', error);
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      setError('Unable to connect: ' + error.message);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const archiveCase = async (caseId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/cases/${caseId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'archived' }),
        }
      );

      const data = await response.json();
      if (data.success) {
        console.log('✅ Case archived:', caseId);
        // Update local state for immediate UI feedback
        setCases(prev =>
          prev.map(c =>
            c.id === caseId ? { ...c, status: 'archived' } : c
          )
        );
      }
    } catch (err: any) {
      console.error('❌ Error archiving case:', err);
    }
  };

  const restoreCase = async (caseId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/cases/${caseId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'active' }),
        }
      );

      const data = await response.json();
      if (data.success) {
        console.log('✅ Case restored:', caseId);
        // Update local state for immediate UI feedback
        setCases(prev =>
          prev.map(c =>
            c.id === caseId ? { ...c, status: 'active' } : c
          )
        );
      }
    } catch (err: any) {
      console.error('❌ Error restoring case:', err);
    }
  };

  const recoverCase = async (caseId: string) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/cases/${caseId}/recover`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        console.log('✅ Case recovered from trash:', caseId);
        // Update local state to restore status to 'active'
        setCases(prev =>
          prev.map(c =>
            c.id === caseId ? { ...c, status: 'active' } : c
          )
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to recover case');
      }
    } catch (err: any) {
      console.error('❌ Error recovering case:', err);
      Alert.alert('Error', 'Failed to recover case: ' + err.message);
    }
  };

  const deleteCase = async (caseId: string, permanent: boolean = false) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const url = permanent
        ? `https://lawyerbuddy-production.up.railway.app/cases/${caseId}?permanent=true`
        : `https://lawyerbuddy-production.up.railway.app/cases/${caseId}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Delete response:', data, 'Status:', response.status);

      if (response.ok || data.success) {
        console.log(permanent ? '✅ Case permanently deleted' : '✅ Case moved to trash', caseId);
        // Update local state - set status = 'deleted' for soft delete, remove for permanent
        setCases(prev =>
          permanent
            ? prev.filter(c => c.id !== caseId)
            : prev.map(c => c.id === caseId ? { ...c, status: 'deleted' } : c)
        );
      } else {
        console.error('❌ Delete failed:', data);
      }
    } catch (err: any) {
      console.error('❌ Error deleting case:', err);
    }
  };

  const handleCaseLongPress = (caseId: string, caseStatus: string, isDeleted: boolean = false) => {
    // In selection mode, toggle selection on long press
    if (selectionMode) {
      toggleCaseSelection(caseId);
      return;
    }

    // Enter selection mode on first long press
    setSelectionMode(true);
    setSelectedCases(new Set([caseId]));
  };

  const toggleCaseSelection = (caseId: string) => {
    setSelectedCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(caseId)) {
        newSet.delete(caseId);
      } else {
        newSet.add(caseId);
      }
      return newSet;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedCases(new Set());
  };

  const archiveSelectedCases = async () => {
    for (const caseId of selectedCases) {
      await archiveCase(caseId);
    }
    exitSelectionMode();
  };

  const deleteSelectedCases = async () => {
    Alert.alert(t('delete'), 'Delete selected cases?', [
      { text: t('cancel'), onPress: () => {}, style: 'cancel' },
      {
        text: t('delete'),
        onPress: async () => {
          for (const caseId of selectedCases) {
            await deleteCase(caseId, false);
          }
          exitSelectionMode();
        },
        style: 'destructive',
      },
    ]);
  };

  const saveTemplate = async (caseType: string, checklistItems: any[]) => {
    try {
      if (!caseType || !checklistItems.length) {
        console.warn('⚠️ Cannot save template: missing case type or checklist items');
        return;
      }

      const updated = { ...savedTemplates, [caseType]: checklistItems };
      await AsyncStorage.setItem('caseTemplates', JSON.stringify(updated));
      setSavedTemplates(updated);
      console.log('✅ Template saved for case type:', caseType);
    } catch (err) {
      console.error('❌ Error saving template:', err);
    }
  };

  const applyTemplate = (caseType: string) => {
    const template = savedTemplates[caseType];
    if (template && selectedCaseId) {
      console.log('✅ Applying template for case type:', caseType, 'with', template.length, 'items');
      // Template items will be added to the case's checklist
      // This is handled in the CaseDetailScreen
      return template;
    }
    return null;
  };

  const handleLogout = async () => {
    console.log('🔴 Logging out...');
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    setSuccess(false);
    setUserData(null);
    setCases([]);
    setUserToken(null);
    setSelectedCaseId(null);
    setShowNewCaseForm(false);
    setCurrentInviteToken(null);
    console.log('✅ Logout complete');
  };

  const handleSendInvite = async () => {
    setInviteError('');

    if (!inviteEmail.trim()) {
      setInviteError('Please enter an email address');
      return;
    }

    setInviteLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setInviteError('Not authenticated');
        setInviteLoading(false);
        return;
      }

      const caseId = selectedCaseId;
      if (!caseId) {
        setInviteError('No case selected');
        setInviteLoading(false);
        return;
      }

      console.log('📧 Sending invite to:', inviteEmail, 'for case:', caseId);

      const response = await fetch(
        `https://lawyerbuddy-production.up.railway.app/cases/${caseId}/invite`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ invitedEmail: inviteEmail }),
        }
      );

      const data = await response.json();
      console.log('📧 Invite response:', data);

      if (response.ok) {
        console.log('✅ Invite sent successfully');
        Alert.alert(t('inviteSent'), `Link expires in 7 days`, [
          { text: t('cancel'), onPress: () => {}, style: 'cancel' },
          {
            text: t('ok'),
            onPress: () => {
              // Show template save alert if case has checklist items
              const selectedCase = cases.find((c) => c.id === caseId);
              if (selectedCase && selectedCase.checklist && selectedCase.checklist.length > 0) {
                Alert.alert(
                  'Save Template?',
                  `Save this ${selectedCase.case_type} case setup as a template for future cases?`,
                  [
                    {
                      text: t('cancel'),
                      onPress: () => {
                        console.log('Template not saved');
                      },
                    },
                    {
                      text: 'Save Template',
                      onPress: async () => {
                        await saveTemplate(selectedCase.case_type || 'General', selectedCase.checklist);
                        Alert.alert('Success', 'Template saved! You can apply it when creating new cases.');
                      },
                    },
                  ]
                );
              }
            },
          },
        ]);

        setInviteEmail('');
        setShowInviteModal(false);
      } else {
        const errorMessage = data.error || data.message || 'Failed to send invite';
        console.error('❌ Invite error:', errorMessage);
        setInviteError(errorMessage);
      }
    } catch (err: any) {
      console.error('❌ Error sending invite:', err);
      setInviteError('Network error: ' + err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  // Accept Invite Screen (via deep link)
  if (currentInviteToken) {
    return (
      <AcceptInviteScreen
        inviteToken={currentInviteToken}
        onClose={() => {
          console.log('❌ Closing accept invite screen');
          setCurrentInviteToken(null);
        }}
        onSuccess={(token: string, userData: any) => {
          console.log('✅ Invite accepted! Auto-logging in user...');
          setUserToken(token);
          setUserData(userData);
          setSuccess(true);
          setCurrentInviteToken(null);
        }}
        styles={styles}
      />
    );
  }

  // Case Detail Screen
  if (success && userData && selectedCaseId) {
    const selectedCase = cases.find((c) => c.id === selectedCaseId);
    if (selectedCase && Object.keys(selectedCase).length > 0) {
      return (
        <CaseDetailScreen
          caseData={selectedCase}
          onBack={() => {
            console.log('🔙 Navigating back from case detail');
            setSelectedCaseId(null);
          }}
          styles={styles}
          userToken={userToken}
          showInviteModal={showInviteModal}
          setShowInviteModal={setShowInviteModal}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          onSendInvite={handleSendInvite}
          inviteLoading={inviteLoading}
          inviteError={inviteError}
          messages={messages}
          setMessages={setMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          messagesLoading={messagesLoading}
          messagesSendingId={messagesSendingId}
          sendMessage={sendMessage}
          courtDates={courtDates}
          setCourtDates={setCourtDates}
          newDateLabel={newDateLabel}
          setNewDateLabel={setNewDateLabel}
          newDateValue={newDateValue}
          setNewDateValue={setNewDateValue}
          newDateSeverity={newDateSeverity}
          setNewDateSeverity={setNewDateSeverity}
          showAddDateModal={showAddDateModal}
          setShowAddDateModal={setShowAddDateModal}
          datesLoading={datesLoading}
          addCourtDate={addCourtDate}
          caseDetailTab={caseDetailTab}
          setCaseDetailTab={setCaseDetailTab}
          deleteMessage={deleteMessage}
          deleteCourtDate={deleteCourtDate}
        />
      );
    } else {
      // Case not found, clear selection
      console.warn('⚠️ Selected case not found, clearing selection');
      setSelectedCaseId(null);
    }
  }

  // Client Portal Screen
  if (success && userData && userData.role === 'client') {
    return (
      <ClientPortalScreen
        caseData={cases.length > 0 ? cases[0] : null}
        userToken={userToken}
        onLogout={handleLogout}
        styles={styles}
      />
    );
  }

  // Lawyer Dashboard Screen
  if (success && userData) {
    // Filter cases based on search query and status filter
    const filteredCases = cases.filter((caseItem) => {
      // Filter by search query
      const matchesSearch = caseItem.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filter by status and deletion status
      const caseStatus = caseItem.status || 'active';
      const isDeleted = caseStatus === 'deleted';
      let matchesStatus = true;

      if (statusFilter === 'trash') {
        // Trash filter shows only soft-deleted cases
        matchesStatus = isDeleted;
      } else if (statusFilter === 'all') {
        // 'All' filter shows non-deleted cases
        matchesStatus = !isDeleted;
      } else if (statusFilter === 'active') {
        // Active filter shows only active, non-deleted cases
        matchesStatus = !isDeleted && caseStatus === 'active';
      } else if (statusFilter === 'archived') {
        // Archived filter shows only archived, non-deleted cases
        matchesStatus = !isDeleted && caseStatus === 'archived';
      }

      return matchesSearch && matchesStatus;
    });

    // Sort by most recently updated
    filteredCases.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return (
      <SafeAreaView style={styles.container}>
        {/* Calculate unique previously-used case types for autocomplete */}
        {(() => {
          const usedTypes = new Set<string>();
          cases.forEach(c => {
            if (c.case_type) usedTypes.add(c.case_type);
          });
          const suggestedTypes = Array.from(usedTypes).sort();

          return (
            <NewCaseModal
              visible={showNewCaseForm}
              onClose={() => setShowNewCaseForm(false)}
              onCreateCase={handleCreateCase}
              newCaseTitle={newCaseTitle}
              setNewCaseTitle={setNewCaseTitle}
              newCaseType={newCaseType}
              setNewCaseType={setNewCaseType}
              newCaseDocket={newCaseDocket}
              setNewCaseDocket={setNewCaseDocket}
              newCaseLoading={newCaseLoading}
              newCaseError={newCaseError}
              styles={styles}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              suggestedCaseTypes={suggestedTypes}
            />
          );
        })()}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t('good')} {t(getTimeOfDay())},</Text>
            <Text style={styles.userName}>
              {userData && userData.full_name
                ? userData.full_name.split(' ')[0]
                : 'Lawyer'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* My Cases Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('myCases')}</Text>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={t('search')}
                placeholderTextColor="#666666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  statusFilter === 'all' && styles.filterButtonActive,
                ]}
                onPress={() => setStatusFilter('all')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === 'all' && styles.filterButtonTextActive,
                  ]}
                >
                  {t('all')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  statusFilter === 'active' && styles.filterButtonActive,
                ]}
                onPress={() => setStatusFilter('active')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === 'active' && styles.filterButtonTextActive,
                  ]}
                >
                  {t('active')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  statusFilter === 'archived' && styles.filterButtonActive,
                ]}
                onPress={() => setStatusFilter('archived')}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    statusFilter === 'archived' && styles.filterButtonTextActive,
                  ]}
                >
                  {t('archived')}
                </Text>
              </TouchableOpacity>

              {/* Only show Trash button if there are deleted cases */}
              {(() => {
                const hasDeletedCases = cases.some(c => c.status === 'deleted');
                return hasDeletedCases ? (
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      statusFilter === 'trash' && styles.filterButtonActive,
                    ]}
                    onPress={() => setStatusFilter('trash')}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        statusFilter === 'trash' && styles.filterButtonTextActive,
                      ]}
                    >
                      {t('trash')}
                    </Text>
                  </TouchableOpacity>
                ) : null;
              })()}
            </View>

            {casesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={styles.loadingText}>{t('loading')}...</Text>
              </View>
            ) : filteredCases.length > 0 ? (
              <View style={styles.casesList}>
                {filteredCases.map((caseItem, index) => {
                  const isSelected = selectedCases.has(caseItem.id);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.caseCard,
                        {
                          borderLeftColor: getCaseTypeColor(caseItem.case_type || 'Other'),
                          opacity: caseItem.status === 'archived' ? 0.6 : 1,
                          backgroundColor: isSelected ? '#1a3a52' : '#1a1a1a',
                          borderColor: isSelected ? '#0066cc' : '#333333',
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => {
                        // In selection mode, toggle selection on tap
                        if (selectionMode) {
                          toggleCaseSelection(caseItem.id);
                        } else {
                          console.log('📂 Navigating to case detail:', caseItem.id, caseItem.title);
                          setSelectedCaseId(caseItem.id);
                        }
                      }}
                      onLongPress={() => {
                        console.log('📋 Long press on case:', caseItem.id);
                        handleCaseLongPress(caseItem.id, caseItem.status || 'active', caseItem.status === 'deleted');
                      }}
                      activeOpacity={0.7}
                      delayLongPress={500}
                    >
                      <View style={styles.caseCardHeader}>
                        {/* Checkbox - visible only in selection mode */}
                        {selectionMode && (
                          <TouchableOpacity
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxChecked,
                            ]}
                            onPress={() => toggleCaseSelection(caseItem.id)}
                            activeOpacity={0.7}
                          >
                            {isSelected && <Text style={styles.checkmark}>✓</Text>}
                          </TouchableOpacity>
                        )}

                        {/* Title and Emoji */}
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Text style={{ fontSize: 20, marginRight: 10 }}>
                              {getCaseTypeEmoji(caseItem.case_type || 'Other')}
                            </Text>
                            <Text style={styles.caseTitle}>{caseItem.title || t('untitledCase')}</Text>
                          </View>
                        </View>

                        {/* Status Badge */}
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(caseItem.status) + '20' },
                          ]}
                        >
                          <Text style={[styles.statusText, { color: getStatusColor(caseItem.status) }]}>
                            {getStatusLabel(caseItem.status || 'active')}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.caseType}>
                        {caseItem.case_type || t('general')}
                        {caseItem.docket_number ? ` • Docket: ${caseItem.docket_number}` : ''}
                      </Text>
                      <Text style={styles.caseDetails}>
                        {caseItem.client?.full_name ? `${t('client')}: ${caseItem.client.full_name}` : t('noClient')}
                      </Text>
                      {checklistProgress[caseItem.id] && (
                        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#333333' }}>
                          <Text style={{ color: '#888888', fontSize: 13, fontWeight: '500' }}>
                            ✓ {checklistProgress[caseItem.id].completed}/{checklistProgress[caseItem.id].total} items complete
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {searchQuery || statusFilter !== 'active'
                    ? 'No matching cases'
                    : t('noCases')}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery || statusFilter !== 'active'
                    ? 'Try adjusting your filters'
                    : t('createFirstCase')}
                </Text>
              </View>
            )}

          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Multi-select Toolbar - Visible only in selection mode */}
        {selectionMode && (
          <View style={styles.selectionToolbar}>
            <View style={styles.selectionInfo}>
              <Text style={styles.selectionText}>
                {selectedCases.size} {selectedCases.size === 1 ? 'case' : 'cases'} selected
              </Text>
            </View>
            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={[styles.toolbarButton, styles.toolbarButtonSecondary]}
                onPress={exitSelectionMode}
              >
                <Text style={styles.toolbarButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarButton, styles.toolbarButtonWarning]}
                onPress={archiveSelectedCases}
              >
                <Text style={styles.toolbarButtonText}>{t('archive')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolbarButton, styles.toolbarButtonDanger]}
                onPress={deleteSelectedCases}
              >
                <Text style={styles.toolbarButtonText}>{t('delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* New Case Button - Fixed at Bottom */}
        {!selectionMode && (
          <View style={styles.bottomButton}>
            <TouchableOpacity
              style={styles.newCaseButton}
              onPress={() => setShowNewCaseForm(true)}
            >
              <Text style={styles.newCaseButtonText}>+ {t('newCase')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Login Screen
  return (
    <View style={styles.container}>
      {/* Language Toggle */}
      <View style={styles.languageToggle}>
        <TouchableOpacity
          style={[styles.langButton, AppState.language === 'en' && styles.langButtonActive]}
          onPress={async () => {
            AppState.language = 'en';
            await AsyncStorage.setItem('appLanguage', 'en');
            forceUpdate(n => n + 1); // Trigger re-render
            console.log('🌐 Language switched to EN');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.langText, AppState.language === 'en' && styles.langTextActive]}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langButton, AppState.language === 'es' && styles.langButtonActive]}
          onPress={async () => {
            AppState.language = 'es';
            await AsyncStorage.setItem('appLanguage', 'es');
            forceUpdate(n => n + 1); // Trigger re-render
            console.log('🌐 Language switched to ES');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.langText, AppState.language === 'es' && styles.langTextActive]}>ES</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoInitials}>LB</Text>
          </View>
          <Text style={styles.logoText}>{t('lawyerBuddy')}</Text>
          <Text style={styles.tagline}>{t('tuAbogado')}</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('email')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('email')}
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('password')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('password')}
                placeholderTextColor="#666666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: 12,
                  padding: 8,
                }}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={{ fontSize: 18 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Email Checkbox */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <TouchableOpacity
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: '#0066cc',
                backgroundColor: rememberEmail ? '#0066cc' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 8,
              }}
              onPress={() => setRememberEmail(!rememberEmail)}
            >
              {rememberEmail && <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
            </TouchableOpacity>
            <Text style={{ color: '#888888', fontSize: 14 }}>Save email for next time</Text>
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>{t('login')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>{t('dontHaveAccount')} </Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}>{t('signUp')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function parseInviteToken(url: string): string | null {
  // Parse URLs like: lawyerbuddy://invite/token123
  // or lawyerbuddy://invite?token=token123
  try {
    const match = url.match(/lawyerbuddy:\/\/invite\/([^?/]+)/);
    if (match && match[1]) {
      return match[1];
    }

    // Try to parse as URL parameter
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    if (token) {
      return token;
    }
  } catch (err) {
    console.warn('Failed to parse invite token from URL:', err);
  }

  return null;
}

function getCaseTypeColor(caseType: string): string {
  const colorMap: Record<string, string> = {
    'Family Law': '#0066cc',
    'Civil': '#9333ea',
    'Compliance/Forms': '#06b6d4',
    'Criminal Defense': '#dc2626',
    'Other': '#6b7280',
  };
  return colorMap[caseType] || '#0066cc';
}

function getCaseTypeEmoji(caseType: string): string {
  const emojiMap: Record<string, string> = {
    'Family Law': '👨‍👩‍👧‍👦',
    'Civil': '⚖️',
    'Compliance/Forms': '📋',
    'Criminal Defense': '🛡️',
    'Other': '📄',
  };
  return emojiMap[caseType] || '📄';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  // Language Toggle
  languageToggle: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    zIndex: 100,
  },
  langButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
    minWidth: 50,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  langText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 1,
  },
  langTextActive: {
    color: '#ffffff',
  },
  // Login Screen Styles
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  contentContainer: {
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoInitials: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#888888',
    fontStyle: 'italic',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#0a0a0a',
  },
  loginButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#0052a3',
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: -8,
    marginBottom: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#888888',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  // Dashboard Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  searchContainer: {
    marginBottom: 14,
  },
  searchInput: {
    borderWidth: 1.5,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#0a0a0a',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#333333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  filterButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  toggleArchivedButton: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#333333',
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
  },
  toggleArchivedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066cc',
    textTransform: 'uppercase',
  },
  casesList: {
    gap: 14,
  },
  caseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    borderLeftWidth: 5,
    borderLeftColor: '#0066cc',
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  caseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  caseType: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  caseDetails: {
    fontSize: 13,
    color: '#aaaaaa',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: '#888888',
    marginTop: 12,
  },
  bottomButton: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  newCaseButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  newCaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#888888',
    fontWeight: '600',
  },
  modalForm: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 28,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#0a0a0a',
  },
  caseTypePicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  caseTypeOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
  },
  caseTypeOptionSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e20',
  },
  caseTypeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  caseTypeOptionTextSelected: {
    color: '#22c55e',
  },
  formError: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  // Invite Modal Button Styles
  inviteButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  inviteCancelButton: {
    flex: 1,
    backgroundColor: '#555555',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  inviteCancelButtonDisabled: {
    opacity: 0.6,
  },
  inviteCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  inviteSendButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  inviteSendButtonDisabled: {
    opacity: 0.6,
  },
  inviteSendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Tab Styles
  detailTabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    marginBottom: 16,
  },
  detailTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  detailTabActive: {
    borderBottomColor: '#0066cc',
  },
  detailTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888888',
  },
  detailTabTextActive: {
    color: '#0066cc',
  },
  // Remember Me Checkbox
  // Case Detail Screen
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  detailContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  detailSection: {
    marginBottom: 32,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addItemButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#0066cc',
  },
  addItemButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyChecklistText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    paddingVertical: 24,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  checklistItemText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 12,
    flex: 1,
  },
  checklistItemCompleted: {
    color: '#888888',
    textDecorationLine: 'line-through',
  },
  checklistCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#0066cc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  checklistCheckmark: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '700',
  },
  addItemInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#0a0a0a',
  },
  addItemConfirmButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addItemConfirmButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailBottomButton: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  inviteButton: {
    backgroundColor: '#0066cc',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Multi-select Styles
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#555555',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  selectionToolbar: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectionInfo: {
    flex: 1,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  toolbarButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButtonSecondary: {
    backgroundColor: '#444444',
  },
  toolbarButtonWarning: {
    backgroundColor: '#f59e0b',
  },
  toolbarButtonDanger: {
    backgroundColor: '#dc2626',
  },
  toolbarButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
});
