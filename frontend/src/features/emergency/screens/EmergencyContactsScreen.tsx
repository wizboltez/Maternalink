import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import { emergencyService, EmergencyContact } from '../services/emergencyService';

const RELATIONS = ['Husband', 'Mother', 'Doctor', 'Sister', 'Father', 'Brother', 'Other'];
const PRIORITIES = [
  { label: 'Priority 1 (Highest)', value: 1 },
  { label: 'Priority 2 (Medium)', value: 2 },
  { label: 'Priority 3 (Lowest)', value: 3 },
];

export const EmergencyContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [relation, setRelation] = useState(RELATIONS[0]);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [priority, setPriority] = useState(1);

  // Pickers State
  const [relationModalVisible, setRelationModalVisible] = useState(false);
  const [priorityModalVisible, setPriorityModalVisible] = useState(false);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      const data = await emergencyService.getContacts();
      setContacts(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to load emergency contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  // const syncFromDevice = async (showFeedback: boolean) => {
  //   setIsSyncing(true);
  //   try {
  //     const synced = await syncDeviceContactsToBackend();
  //     setContacts(synced);
  //     if (showFeedback) {
  //       Alert.alert('Sync Complete', 'Device contacts matching ICE, Emergency, or SOS have been synced.');
  //     }
  //   } catch (error: any) {
  //     if (showFeedback) {
  //       Alert.alert('Sync Failed', error.message || 'Failed to sync device contacts.');
  //     }
  //   } finally {
  //     setIsSyncing(false);
  //   }
  // };

  useEffect(() => {
  loadContacts();
}, []);

  const openAddModal = () => {
    setEditingContact(null);
    setName('');
    setRelation(RELATIONS[0]);
    setPhone('');
    setWhatsapp('');
    setPriority(1);
    setModalVisible(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setName(contact.name);
    setRelation(contact.relation);
    setPhone(contact.phone);
    setWhatsapp(contact.whatsapp);
    setPriority(contact.priority);
    setModalVisible(true);
  };

  // Phone number validator (digits only, optionally starting with +, between 8 and 15 digits)
  const validatePhone = (num: string) => {
    const cleaned = num.trim();
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    return phoneRegex.test(cleaned);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Contact name is required.');
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert('Validation Error', 'Please enter a valid phone number (8-15 digits, digits only or leading +).');
      return;
    }
    if (!validatePhone(whatsapp)) {
      Alert.alert(
        'Validation Error',
        'Please enter a valid WhatsApp number (8-15 digits, digits only or leading +).'
      );
      return;
    }

    const payload = {
      name: name.trim(),
      relation,
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      priority,
    };

    setIsLoading(true);
    try {
      let updatedContacts: EmergencyContact[];
      if (editingContact && editingContact._id) {
        updatedContacts = await emergencyService.updateContact(editingContact._id, payload);
      } else {
        updatedContacts = await emergencyService.addContact(payload);
      }
      setContacts(updatedContacts);
      setModalVisible(false);
      Alert.alert('Success', 'Emergency contact saved successfully.');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save contact.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (contact: EmergencyContact) => {
    if (!contact._id) return;
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const updatedContacts = await emergencyService.deleteContact(contact._id!);
              setContacts(updatedContacts);
              setModalVisible(false);
              Alert.alert('Success', 'Emergency contact deleted.');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete contact.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (prio: number) => {
    switch (prio) {
      case 1:
        return Theme.colors.danger;
      case 2:
        return Theme.colors.warning;
      case 3:
      default:
        return Theme.colors.success;
    }
  };

  const getPriorityLabel = (prio: number) => {
    switch (prio) {
      case 1:
        return 'Highest Priority';
      case 2:
        return 'Medium Priority';
      case 3:
      default:
        return 'Lowest Priority';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>Emergency Contacts</Heading>
        <BodyText style={styles.subtitle}>People to notify in case of an alert</BodyText>
        
      </View>

      {isLoading && contacts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <BodyText style={styles.loadingText}>Loading contacts...</BodyText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {contacts.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Subheading style={styles.emptyIcon}>📢</Subheading>
              <Subheading style={styles.emptyTitle}>No Contacts Registered</Subheading>
              <Caption style={styles.emptyText}>
                You haven't added any emergency contacts yet. Please register at least one contact so the platform can send notifications during emergencies.
              </Caption>
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card
                key={contact._id}
                onPress={() => openEditModal(contact)}
                style={styles.contactCard}
              >
                <View style={styles.contactHeader}>
                  <View>
                    <Subheading style={styles.contactName}>{contact.name}</Subheading>
                    <Caption style={styles.relationBadge}>{contact.relation}</Caption>
                  </View>
                  <View
                    style={[
                      styles.priorityIndicator,
                      { backgroundColor: getPriorityColor(contact.priority) + '15' },
                    ]}
                  >
                    <Caption style={{ color: getPriorityColor(contact.priority), fontWeight: 'bold' }}>
                      P{contact.priority}
                    </Caption>
                  </View>
                </View>

                <View style={styles.contactDetailRow}>
                  <BodyText style={styles.detailLabel}>📞 Mobile:</BodyText>
                  <BodyText style={styles.detailValue}>{contact.phone}</BodyText>
                </View>
                <View style={styles.contactDetailRow}>
                  <BodyText style={styles.detailLabel}>💬 WhatsApp:</BodyText>
                  <BodyText style={styles.detailValue}>{contact.whatsapp}</BodyText>
                </View>
              </Card>
            ))
          )}

          <Button
            title="＋ Add New Contact"
            onPress={openAddModal}
            style={styles.addButton}
          />
        </ScrollView>
      )}

      {/* Main Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Subheading style={styles.modalTitle}>
                {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
              </Subheading>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Heading style={styles.closeBtn}>×</Heading>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll}>
              <BodyText style={styles.inputLabel}>Full Name</BodyText>
              <TextInput
                placeholder="e.g. John Doe"
                placeholderTextColor={Theme.colors.textMuted}
                value={name}
                onChangeText={setName}
                style={styles.textInput}
              />

              <BodyText style={styles.inputLabel}>Relation</BodyText>
              <TouchableOpacity
                onPress={() => setRelationModalVisible(true)}
                style={styles.selectorBtn}
              >
                <BodyText style={styles.selectorBtnText}>{relation}</BodyText>
                <Caption>▼</Caption>
              </TouchableOpacity>

              <BodyText style={styles.inputLabel}>Phone Number</BodyText>
              <TextInput
                placeholder="e.g. +15551234567"
                placeholderTextColor={Theme.colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                style={styles.textInput}
              />

              <BodyText style={styles.inputLabel}>WhatsApp Number</BodyText>
              <TextInput
                placeholder="e.g. +15551234567"
                placeholderTextColor={Theme.colors.textMuted}
                keyboardType="phone-pad"
                value={whatsapp}
                onChangeText={setWhatsapp}
                style={styles.textInput}
              />

              <BodyText style={styles.inputLabel}>Notification Priority</BodyText>
              <TouchableOpacity
                onPress={() => setPriorityModalVisible(true)}
                style={styles.selectorBtn}
              >
                <BodyText style={styles.selectorBtnText}>{getPriorityLabel(priority)}</BodyText>
                <Caption>▼</Caption>
              </TouchableOpacity>

              <View style={styles.modalActionRow}>
                {editingContact && (
                  <Button
                    title="Delete"
                    variant="danger"
                    onPress={() => handleDelete(editingContact)}
                    style={styles.modalActionBtn}
                  />
                )}
                <Button
                  title="Save"
                  onPress={handleSave}
                  style={styles.modalActionBtn}
                  loading={isLoading}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Relation Picker Modal */}
      <Modal visible={relationModalVisible} transparent={true} animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <Subheading style={styles.pickerTitle}>Select Relation</Subheading>
            {RELATIONS.map((rel) => (
              <TouchableOpacity
                key={rel}
                style={styles.pickerOption}
                onPress={() => {
                  setRelation(rel);
                  setRelationModalVisible(false);
                }}
              >
                <BodyText style={relation === rel ? styles.selectedOptionText : styles.optionText}>
                  {rel}
                </BodyText>
              </TouchableOpacity>
            ))}
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setRelationModalVisible(false)}
              style={styles.pickerCancel}
            />
          </View>
        </View>
      </Modal>

      {/* Priority Picker Modal */}
      <Modal visible={priorityModalVisible} transparent={true} animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <Subheading style={styles.pickerTitle}>Select Alert Priority</Subheading>
            {PRIORITIES.map((prio) => (
              <TouchableOpacity
                key={prio.value}
                style={styles.pickerOption}
                onPress={() => {
                  setPriority(prio.value);
                  setPriorityModalVisible(false);
                }}
              >
                <BodyText style={priority === prio.value ? styles.selectedOptionText : styles.optionText}>
                  {prio.label}
                </BodyText>
              </TouchableOpacity>
            ))}
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setPriorityModalVisible(false)}
              style={styles.pickerCancel}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { paddingHorizontal: Theme.spacing.xl, paddingTop: Theme.spacing.xxl, paddingBottom: Theme.spacing.md },
  syncButton: { marginTop: Theme.spacing.md },
  title: { color: Theme.colors.primaryDark },
  subtitle: { color: Theme.colors.textSecondary, marginTop: Theme.spacing.xs },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Theme.spacing.sm, color: Theme.colors.textSecondary },
  scroll: { padding: Theme.spacing.xl, paddingBottom: 100 },
  addButton: { marginTop: Theme.spacing.md, marginBottom: Theme.spacing.xl },
  emptyCard: { padding: Theme.spacing.xl, alignItems: 'center', backgroundColor: Theme.colors.primaryLight + '40', borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.colors.primary },
  emptyIcon: { fontSize: 40, marginBottom: Theme.spacing.md },
  emptyTitle: { color: Theme.colors.primaryDark, marginBottom: Theme.spacing.sm },
  emptyText: { textAlign: 'center', color: Theme.colors.textSecondary, lineHeight: 18 },
  contactCard: { padding: Theme.spacing.lg, marginBottom: Theme.spacing.md },
  contactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: Theme.colors.divider, paddingBottom: Theme.spacing.sm, marginBottom: Theme.spacing.sm },
  contactName: { color: Theme.colors.text, fontWeight: '700' },
  relationBadge: { alignSelf: 'flex-start', color: Theme.colors.accent, fontWeight: '600', marginTop: 2 },
  priorityIndicator: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Theme.borders.radius.sm },
  contactDetailRow: { flexDirection: 'row', marginTop: Theme.spacing.xs },
  detailLabel: { color: Theme.colors.textMuted, width: 90, fontSize: Theme.typography.sizes.sm },
  detailValue: { color: Theme.colors.text, fontWeight: '500', fontSize: Theme.typography.sizes.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(28, 25, 46, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Theme.colors.cardBackground, borderTopLeftRadius: Theme.borders.radius.xl, borderTopRightRadius: Theme.borders.radius.xl, padding: Theme.spacing.xl, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Theme.colors.divider, paddingBottom: Theme.spacing.md, marginBottom: Theme.spacing.md },
  modalTitle: { color: Theme.colors.primaryDark, fontWeight: 'bold' },
  closeBtn: { fontSize: 28, color: Theme.colors.textMuted },
  formScroll: { marginBottom: Theme.spacing.xl },
  inputLabel: { color: Theme.colors.textSecondary, fontSize: Theme.typography.sizes.sm, fontWeight: '600', marginTop: Theme.spacing.md, marginBottom: 6 },
  textInput: { borderWidth: 1, borderColor: Theme.colors.divider, borderRadius: Theme.borders.radius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, color: Theme.colors.text, fontSize: Theme.typography.sizes.base, backgroundColor: Theme.colors.background },
  selectorBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.divider, borderRadius: Theme.borders.radius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, backgroundColor: Theme.colors.background },
  selectorBtnText: { color: Theme.colors.text },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Theme.spacing.xl },
  modalActionBtn: { flex: 1, marginHorizontal: Theme.spacing.xs },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(28, 25, 46, 0.5)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { width: '80%', backgroundColor: Theme.colors.cardBackground, borderRadius: Theme.borders.radius.lg, padding: Theme.spacing.xl, ...Theme.shadows.heavy },
  pickerTitle: { color: Theme.colors.primaryDark, fontWeight: 'bold', alignSelf: 'center', marginBottom: Theme.spacing.md },
  pickerOption: { paddingVertical: Theme.spacing.md, borderBottomWidth: 1, borderBottomColor: Theme.colors.divider, alignItems: 'center' },
  optionText: { color: Theme.colors.textSecondary },
  selectedOptionText: { color: Theme.colors.primary, fontWeight: 'bold' },
  pickerCancel: { marginTop: Theme.spacing.md },
});

export default EmergencyContactsScreen;
