import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CASE_TYPES = ['Family Law', 'Civil', 'Compliance/Forms', 'Criminal Defense', 'Other'];

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userData, setUserData] = useState<{ full_name: string; role: string } | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);

  // New Case Form State
  const [showNewCaseForm, setShowNewCaseForm] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseType, setNewCaseType] = useState('Family Law');
  const [newCaseDocket, setNewCaseDocket] = useState('');
  const [newCaseLoading, setNewCaseLoading] = useState(false);
  const [newCaseError, setNewCaseError] = useState('');

  // Case Detail State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (success && userData) {
      fetchCases();
    }
  }, [success, userData]);

  const fetchCases = async () => {
    try {
      setCasesLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);

      if (!token) {
        console.error('No token found');
        return;
      }

      console.log('Fetching cases with token...');
      const response = await fetch('https://lawyerbuddy-production.up.railway.app/cases', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Cases response:', data);

      if (response.ok && data.cases) {
        setCases(data.cases);
      } else {
        console.error('Failed to fetch cases:', data);
      }
    } catch (err: any) {
      console.error('Error fetching cases:', err);
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
      const name = data?.profile?.full_name || data?.user?.email || 'User';

      // Store token and role
      await AsyncStorage.setItem('userToken', data.session.access_token);
      await AsyncStorage.setItem('userRole', role);

      // Set success state
      setUserData({
        full_name: name,
        role: role,
      });
      setSuccess(true);
      setEmail('');
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

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userRole');
    setSuccess(false);
    setUserData(null);
    setCases([]);
    setUserToken(null);
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
            <Text style={styles.userName}>{userData.full_name.split(' ')[0]}</Text>
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
                      console.log('📂 Tapped case:', caseItem.id, caseItem.title);
                      setSelectedCaseId(caseItem.id);
                      // TODO: Navigate to case detail screen
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
});
