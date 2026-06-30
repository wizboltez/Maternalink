import React from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import { useAuth } from '../../../core/context/AuthContext';
import { getIsOfflineMode, setOfflineMode } from '../../../core/config/api';
import { SosButton } from '../../../core/components/SosButton';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, profile, logout } = useAuth();
  const [offlineMode, setOfflineModeState] = useState(true);

  useEffect(() => {
    getIsOfflineMode().then(setOfflineModeState);
  }, []);

  const handleToggleOffline = async (val: boolean) => {
    await setOfflineMode(val);
    setOfflineModeState(val);
    Alert.alert('Mode Changed', 'Please restart the app to apply the new mode fully.');
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const getTrimesterText = (tri: number) => {
    if (tri === 1) return '1st Trimester (Weeks 1-13)';
    if (tri === 2) return '2nd Trimester (Weeks 14-27)';
    return '3rd Trimester (Weeks 28-42+)';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Heading style={styles.title}>My Settings</Heading>
            <BodyText style={styles.subtitle}>Account and pregnancy information</BodyText>
          </View>
          <SosButton />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Account Settings</Subheading>
          
          <BodyText style={styles.rowLabel}>Name</BodyText>
          <BodyText style={styles.rowValue}>{user?.name}</BodyText>
          
          <BodyText style={styles.rowLabel}>Email</BodyText>
          <BodyText style={styles.rowValue}>{user?.email}</BodyText>

          <BodyText style={styles.rowLabel}>Age</BodyText>
          <BodyText style={styles.rowValue}>{user?.age} years old</BodyText>
        </Card>

        {profile ? (
          <Card style={styles.card}>
            <View style={styles.profileHeader}>
              <Subheading style={styles.cardTitle}>Pregnancy Profile</Subheading>
              <Button
                title="Edit Info"
                variant="outline"
                onPress={() => navigation.navigate('PregnancyProfile', { isEdit: true })}
                style={styles.editBtn}
              />
            </View>
            
            <BodyText style={styles.rowLabel}>Pregnancy Week</BodyText>
            <BodyText style={styles.rowValue}>Week {profile.pregnancyWeek}</BodyText>

            <BodyText style={styles.rowLabel}>Trimester</BodyText>
            <BodyText style={styles.rowValue}>{getTrimesterText(profile.trimester || 1)}</BodyText>
            
            <BodyText style={styles.rowLabel}>Expected Delivery Date</BodyText>
            <BodyText style={styles.rowValue}>
              {new Date(profile.expectedDeliveryDate || Date.now()).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </BodyText>
            
            <BodyText style={styles.rowLabel}>Current Weight</BodyText>
            <BodyText style={styles.rowValue}>{profile.weight} kg</BodyText>

            <BodyText style={styles.rowLabel}>Blood Group</BodyText>
            <BodyText style={styles.rowValue}>{profile.bloodGroup}</BodyText>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Subheading style={styles.cardTitle}>Pregnancy Profile</Subheading>
            <BodyText style={styles.rowValue}>No profile configured yet.</BodyText>
            <Button
              title="Set Up Profile"
              onPress={() => navigation.navigate('PregnancyProfile', { isEdit: false })}
              style={styles.setupBtn}
            />
          </Card>
        )}

        <Card style={styles.card}>
          <Subheading style={styles.cardTitle}>Emergency Alert System</Subheading>
          
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('EmergencyContacts')}
          >
            <View>
              <BodyText style={styles.menuTitle}>🚨 Emergency Contacts</BodyText>
              <Caption style={styles.menuDesc}>Manage contacts notified during alerts</Caption>
            </View>
            <BodyText style={styles.menuArrow}>→</BodyText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate('EmergencyAlertHistory')}
          >
            <View>
              <BodyText style={styles.menuTitle}>🕒 Alert History Logs</BodyText>
              <Caption style={styles.menuDesc}>View past emergency logs & vitals</Caption>
            </View>
            <BodyText style={styles.menuArrow}>→</BodyText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('EmergencySettings')}
          >
            <View>
              <BodyText style={styles.menuTitle}>⚙️ Alert Configurations</BodyText>
              <Caption style={styles.menuDesc}>Manage trigger rules & notifications</Caption>
            </View>
            <BodyText style={styles.menuArrow}>→</BodyText>
          </TouchableOpacity>
        </Card>

        <Button title="Sign Out" variant="danger" onPress={handleLogout} style={styles.logoutBtn} />
        
        <Caption style={styles.version}>Maternalink Guidance System v1.0.0</Caption>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { paddingHorizontal: Theme.spacing.xl, paddingTop: Theme.spacing.xxl, paddingBottom: Theme.spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: Theme.colors.primaryDark },
  subtitle: { color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  scroll: { padding: Theme.spacing.xl, paddingBottom: 100 },
  card: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  cardTitle: { color: Theme.colors.text, fontWeight: '700' },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
    paddingBottom: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  rowLabel: { color: Theme.colors.textMuted, fontSize: Theme.typography.sizes.xs, marginTop: Theme.spacing.sm },
  rowValue: { color: Theme.colors.text, marginTop: 2, fontWeight: '500' },
  editBtn: { paddingVertical: 2, minHeight: 30 },
  setupBtn: { marginTop: Theme.spacing.md },
  logoutBtn: { marginTop: Theme.spacing.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Theme.spacing.md },
  switchLabel: { color: Theme.colors.text, fontWeight: '500' },
  switchDesc: { color: Theme.colors.textMuted },
  version: { textAlign: 'center', marginTop: Theme.spacing.lg, marginBottom: Theme.spacing.xxl },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  menuTitle: {
    fontWeight: '600',
    color: Theme.colors.text,
  },
  menuDesc: {
    color: Theme.colors.textSecondary,
    fontSize: Theme.typography.sizes.xs,
    marginTop: 2,
  },
  menuArrow: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.sizes.md,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
