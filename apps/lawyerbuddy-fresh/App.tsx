import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal, CheckBox } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CASE_TYPES = ['Family Law', 'Civil', 'Compliance/Forms', 'Criminal Defense', 'Other'];

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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite Client</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Client Email Address</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter client email"
                placeholderTextColor="#666666"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!inviteLoading}
              />
            </View>

            {inviteError ? <Text style={styles.formError}>{inviteError}</Text> : null}

            <TouchableOpacity
              style={[styles.createButton, inviteLoading && styles.createButtonDisabled]}
              onPress={onSendInvite}
              disabled={inviteLoading}
            >
              {inviteLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.createButtonText}>Send Invite</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </View>
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
}) {
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [showAddItemInput, setShowAddItemInput] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);

  const handleAddChecklistItem = () => {
    if (newItemText.trim()) {
      setChecklistItems([...checklistItems, newItemText]);
      setCheckedItems([...checkedItems, false]);
      setNewItemText('');
      setShowAddItemInput(false);
      console.log('✅ Added checklist item:', newItemText);
    }
  };

  const toggleChecklistItem = (index: number) => {
    const updated = [...checkedItems];
    updated[index] = !updated[index];
    setCheckedItems(updated);
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.detailTitle}>{caseData?.title || 'Untitled Case'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.detailContent} showsVerticalScrollIndicator={false}>
        {/* Case Information */}
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Case Information</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Case Type:</Text>
            <Text style={styles.detailValue}>{caseData?.case_type || 'General Law'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: '#22c55e' }]}>
              {(caseData?.status || 'active').toUpperCase()}
            </Text>
          </View>

          {caseData?.docket_number && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Docket Number:</Text>
              <Text style={styles.detailValue}>{caseData.docket_number}</Text>
            </View>
          )}

          {caseData?.client_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Client:</Text>
              <Text style={styles.detailValue}>{caseData.client_name}</Text>
            </View>
          )}
        </View>

        {/* Checklist Section */}
        <View style={styles.detailSection}>
          <View style={styles.checklistHeader}>
            <Text style={styles.detailSectionTitle}>Checklist</Text>
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => {
                setShowAddItemInput(!showAddItemInput);
                setNewItemText('');
              }}
            >
              <Text style={styles.addItemButtonText}>{showAddItemInput ? '✕ Cancel' : '+ Add Item'}</Text>
            </TouchableOpacity>
          </View>

          {showAddItemInput && (
            <View style={styles.addItemInputContainer}>
              <TextInput
                style={styles.addItemInput}
                placeholder="Enter item name"
                placeholderTextColor="#666666"
                value={newItemText}
                onChangeText={setNewItemText}
                autoFocus
              />
              <TouchableOpacity
                style={styles.addItemConfirmButton}
                onPress={handleAddChecklistItem}
              >
                <Text style={styles.addItemConfirmButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          {checklistItems.length === 0 && !showAddItemInput ? (
            <Text style={styles.emptyChecklistText}>No checklist items yet</Text>
          ) : (
            checklistItems.map((item, index) => (
              <View key={index} style={styles.checklistItem}>
                <CheckBox
                  value={checkedItems[index] || false}
                  onValueChange={() => toggleChecklistItem(index)}
                />
                <Text
                  style={[
                    styles.checklistItemText,
                    checkedItems[index] && styles.checklistItemCompleted,
                  ]}
                >
                  {item}
                </Text>
              </View>
            ))
          )}
        </View>

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
          <Text style={styles.inviteButtonText}>Invite Client</Text>
        </TouchableOpacity>
      </View>
    </View>
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
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Case</Text>
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
              <Text style={styles.formLabel}>Case Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter case title"
                placeholderTextColor="#666666"
                value={newCaseTitle}
                onChangeText={setNewCaseTitle}
                editable={!newCaseLoading}
                autoFocus={false}
              />
            </View>

            {/* Case Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Case Type *</Text>
              <View style={styles.caseTypePicker}>
                {CASE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.caseTypeOption,
                      newCaseType === type && styles.caseTypeOptionSelected,
                    ]}
                    onPress={() => setNewCaseType(type)}
                    disabled={newCaseLoading}
                  >
                    <Text
                      style={[
                        styles.caseTypeOptionText,
                        newCaseType === type && styles.caseTypeOptionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Docket Number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Docket Number (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter docket number"
                placeholderTextColor="#666666"
                value={newCaseDocket}
                onChangeText={setNewCaseDocket}
                editable={!newCaseLoading}
                autoFocus={false}
              />
            </View>

            {/* Error Message */}
            {newCaseError ? <Text style={styles.formError}>{newCaseError}</Text> : null}

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.createButton, newCaseLoading && styles.createButtonDisabled]}
              onPress={onCreateCase}
              disabled={newCaseLoading}
            >
              {newCaseLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.createButtonText}>Create Case</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<{ full_name: string; role: string } | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // New Case Form State
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseType, setNewCaseType] = useState('Family Law');
  const [newCaseDocket, setNewCaseDocket] = useState('');
  const [newCaseLoading, setNewCaseLoading] = useState(false);
  const [newCaseError, setNewCaseError] = useState('');

  // Case Detail State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Invite Client Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Initialize: Check for existing session and remembered email
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔄 Starting app initialization...');

        // Load remembered email
        try {
          const rememberedEmail = await AsyncStorage.getItem('rememberedEmail');
          if (rememberedEmail) {
            console.log('📧 Loaded remembered email');
            setEmail(rememberedEmail);
          }
        } catch (err) {
          console.error('Error loading remembered email:', err);
        }

        // Check for existing token and auto-login
        try {
          const token = await AsyncStorage.getItem('userToken');
          if (token) {
            console.log('🔐 Found existing token, attempting auto-login...');
            setUserToken(token);

            // Try to fetch user data to verify token is still valid
            const response = await fetch('https://lawyerbuddy-production.up.railway.app/auth/me', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ Token verified, setting user data');
              const role = data?.profile?.role || data?.user?.role || 'lawyer';
              const name = (data?.profile?.full_name || data?.user?.email || 'User').trim();

              if (!name || name === '') {
                console.warn('⚠️ Invalid name from response, using default');
              }

              setUserData({
                full_name: name || 'User',
                role: role,
              });

              // Fetch cases before setting success to avoid dashboard render race
              console.log('📥 Auto-login: fetching cases...');
              setCasesLoading(true);
              try {
                const casesResponse = await fetch('https://lawyerbuddy-production.up.railway.app/cases', {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });

                const casesData = await casesResponse.json();
                if (casesResponse.ok && casesData.cases) {
                  setCases(casesData.cases);
                  console.log('✅ Auto-login: cases loaded');
                } else {
                  console.warn('⚠️ Auto-login: failed to load cases');
                  setCases([]);
                }
              } catch (casesErr) {
                console.error('❌ Auto-login: error fetching cases:', casesErr);
                setCases([]);
              } finally {
                setCasesLoading(false);
              }

              setSuccess(true);
              console.log('✅ Auto-login successful');
            } else {
              console.warn('⚠️ Token verification failed (status:', response.status + ')');
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userRole');
              setSuccess(false);
              setUserData(null);
              setCases([]);
            }
          } else {
            console.log('ℹ️ No existing token found');
          }
        } catch (err) {
          console.error('❌ Error verifying token:', err);
          try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userRole');
          } catch (cleanupErr) {
            console.error('Error cleaning up storage:', cleanupErr);
          }
          setSuccess(false);
          setUserData(null);
          setCases([]);
        }
      } catch (err) {
        console.error('❌ Unexpected error during app initialization:', err);
        setSuccess(false);
        setUserData(null);
      } finally {
        setCheckingSession(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (success && userData) {
      fetchCases();
    }
  }, [success, userData]);

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

        // Reset form and dismiss modal
        setNewCaseTitle('');
        setNewCaseType('Family Law');
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

      if (!response.ok) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      // Extract role and name with null safety
      const role = data?.profile?.role || data?.user?.role || 'lawyer';
      const name = (data?.profile?.full_name || data?.user?.email || 'User').trim();

      // Validate name is not empty
      if (!name || name === '') {
        setError('Invalid user data received from server');
        setLoading(false);
        return;
      }

      // Store token and role
      await AsyncStorage.setItem('userToken', data.session.access_token);
      await AsyncStorage.setItem('userRole', role);

      // Store email if Remember Me is checked
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
      }

      // Set success state
      setUserData({
        full_name: name,
        role: role,
      });
      setSuccess(true);
      setEmail('');
      setPassword('');
      setRememberMe(false);
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

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    setSuccess(false);
    setUserData(null);
    setCases([]);
    setUserToken(null);
    setSelectedCaseId(null);
    setShowNewCaseForm(false);
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
        alert(`✅ Invite sent! Link expires in 7 days`);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return '#22c55e';
      case 'in_progress':
        return '#3b82f6';
      case 'closed':
        return '#888888';
      default:
        return '#0066cc';
    }
  };

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
        />
      );
    } else {
      // Case not found, clear selection
      console.warn('⚠️ Selected case not found, clearing selection');
      setSelectedCaseId(null);
    }
  }

  // Lawyer Dashboard Screen
  if (success && userData) {
    return (
      <View style={styles.container}>
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
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.userName}>
              {userData && userData.full_name
                ? userData.full_name.split(' ')[0]
                : 'Lawyer'}
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* My Cases Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Cases</Text>

            {casesLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={styles.loadingText}>Loading cases...</Text>
              </View>
            ) : cases.length > 0 ? (
              <View style={styles.casesList}>
                {cases.map((caseItem, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.caseCard}
                    onPress={() => {
                      console.log('📂 Navigating to case detail:', caseItem.id, caseItem.title);
                      setSelectedCaseId(caseItem.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.caseCardHeader}>
                      <Text style={styles.caseTitle}>{caseItem.title || 'Untitled Case'}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(caseItem.status) + '20' },
                        ]}
                      >
                        <Text style={[styles.statusText, { color: getStatusColor(caseItem.status) }]}>
                          {(caseItem.status || 'active').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.caseType}>
                      {caseItem.case_type || 'General Law'}
                      {caseItem.docket_number ? ` • Docket: ${caseItem.docket_number}` : ''}
                    </Text>
                    <Text style={styles.caseDetails}>
                      {caseItem.client_name ? `Client: ${caseItem.client_name}` : 'No client assigned'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No cases yet</Text>
                <Text style={styles.emptyStateSubtext}>Create your first case to get started</Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* New Case Button - Fixed at Bottom */}
        <View style={styles.bottomButton}>
          <TouchableOpacity
            style={styles.newCaseButton}
            onPress={() => setShowNewCaseForm(true)}
          >
            <Text style={styles.newCaseButtonText}>+ New Case</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Loading Screen (while checking for existing session)
  if (checkingSession) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingSessionText}>Loading...</Text>
      </View>
    );
  }

  // Login Screen
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>LawyerBuddy</Text>
          <Text style={styles.tagline}>Tu Abogado</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
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
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#666666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          {/* Remember Me Checkbox */}
          <View style={styles.rememberMeContainer}>
            <CheckBox
              value={rememberMe}
              onValueChange={setRememberMe}
              disabled={loading}
              tintColors={{ true: '#0066cc', false: '#666666' }}
            />
            <Text style={styles.rememberMeText}>Remember me</Text>
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
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}>I'm a lawyer - Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Login Screen Styles
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#888888',
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
  },
  loginButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  loginButtonDisabled: {
    backgroundColor: '#0052a3',
    opacity: 0.8,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
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
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 4,
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
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  casesList: {
    gap: 12,
  },
  caseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  caseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    fontSize: 13,
    color: '#888888',
    marginBottom: 8,
    fontWeight: '500',
  },
  caseDetails: {
    fontSize: 12,
    color: '#666666',
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  newCaseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
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
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Remember Me Checkbox
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -12,
    marginBottom: 16,
  },
  rememberMeText: {
    fontSize: 14,
    color: '#888888',
    marginLeft: 8,
  },
  // Loading Session
  loadingSessionText: {
    fontSize: 16,
    color: '#888888',
    marginTop: 16,
  },
  // Case Detail Screen
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: {
    paddingVertical: 8,
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
});
