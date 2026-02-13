import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import Dropdown from '@/components/Dropdown';
import { ACADEMIC_CONFIG } from '@/lib/academic-config';
import Colors from '@/constants/colors';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { branding } = useBranding();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'student' | 'teacher'>('student');
  const [department, setDepartment] = useState<string | null>(null);
  const [academicYear, setAcademicYear] = useState<number | null>(null);
  const [classSection, setClassSection] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    if (!displayName.trim() || !username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    
    // Additional validation for students
    if (userType === 'student') {
      if (!department || !academicYear || !classSection) {
        setError('Please select department, academic year, and class section');
        return;
      }
    }

    setLoading(true);
    setError('');
    
    const result = await register(
      username.trim(), 
      password, 
      displayName.trim(),
      userType === 'teacher' ? 'creator' : 'listener',
      userType === 'student' ? (department || undefined) : undefined,
      userType === 'student' ? (academicYear || undefined) : undefined,
      userType === 'student' ? (classSection || undefined) : undefined
    );
    
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Registration failed');
    }
  }

  return (
    <LinearGradient
      colors={[Colors.dark.background, '#0D1225', Colors.dark.surface]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: (Platform.OS === 'web' ? 67 : insets.top) + 20,
              paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 20,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.dark.text} />
          </Pressable>

          <View style={styles.headerArea}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join {branding.appName} and start streaming</Text>
          </View>

          <View style={styles.formArea}>
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.dark.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Display Name"
                placeholderTextColor={Colors.dark.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="at-outline" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={Colors.dark.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.dark.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.dark.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.dark.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.dark.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            {/* User Type Selection */}
            <View style={styles.userTypeContainer}>
              <Text style={styles.label}>I am a:</Text>
              <View style={styles.userTypeRow}>
                <Pressable
                  style={[styles.userTypeOption, userType === 'student' && { backgroundColor: branding.accentColor }]}
                  onPress={() => setUserType('student')}
                >
                  <Ionicons 
                    name="school-outline" 
                    size={20} 
                    color={userType === 'student' ? '#fff' : Colors.dark.textSecondary} 
                  />
                  <Text style={[styles.userTypeText, userType === 'student' && { color: '#fff' }]}>
                    Student
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.userTypeOption, userType === 'teacher' && { backgroundColor: branding.accentColor }]}
                  onPress={() => setUserType('teacher')}
                >
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={userType === 'teacher' ? '#fff' : Colors.dark.textSecondary} 
                  />
                  <Text style={[styles.userTypeText, userType === 'teacher' && { color: '#fff' }]}>
                    Teacher
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Academic Information for Students */}
            {userType === 'student' && (
              <>
                <Dropdown
                  label="Department"
                  value={department}
                  items={ACADEMIC_CONFIG.DEPARTMENTS}
                  onSelect={(value) => setDepartment(value as string)}
                  placeholder="Select Department"
                  icon="business-outline"
                />

                <View style={styles.academicRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Dropdown
                      label="Academic Year"
                      value={academicYear}
                      items={ACADEMIC_CONFIG.YEARS}
                      onSelect={(value) => setAcademicYear(value as number)}
                      placeholder="Select Year"
                      icon="calendar-outline"
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Dropdown
                      label="Class Section"
                      value={classSection}
                      items={ACADEMIC_CONFIG.DIVISIONS}
                      onSelect={(value) => setClassSection(value as string)}
                      placeholder="Select Section"
                      icon="people-outline"
                    />
                  </View>
                </View>
              </>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.registerBtn,
                { backgroundColor: branding.accentColor, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.dark.background} />
              ) : (
                <Text style={styles.registerBtnText}>Create Account</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.footerLink, { color: branding.accentColor }]}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerArea: {
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: Colors.dark.textSecondary,
    marginTop: 6,
  },
  formArea: {
    gap: 14,
  },
  userTypeContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  userTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  userTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.dark.card,
  },
  userTypeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: Colors.dark.text,
  },
  academicRow: {
    flexDirection: 'row',
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dark.danger + '15',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: Colors.dark.danger,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: Colors.dark.text,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  registerBtn: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: Colors.dark.background,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
  },
  footerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  footerLink: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
});
