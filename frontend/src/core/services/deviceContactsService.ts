import * as Contacts from 'expo-contacts';
import { Alert, Platform } from 'react-native';
import { emergencyService, EmergencyContact } from '../../features/emergency/services/emergencyService';

const ICE_KEYWORDS = ['ice', 'emergency', 'sos'];

export interface DeviceIceContact {
  name: string;
  phone: string;
  relation: string;
}

function matchesIceKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return ICE_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractPhoneNumbers(contact: Contacts.Contact): string[] {
  const numbers: string[] = [];
  if (contact.phoneNumbers) {
    for (const entry of contact.phoneNumbers) {
      const cleaned = (entry.number || '').replace(/[\s\-().]/g, '');
      if (cleaned.length >= 8) {
        numbers.push(cleaned);
      }
    }
  }
  return numbers;
}

function inferRelation(name: string, notes?: string): string {
  const combined = `${name} ${notes || ''}`.toLowerCase();
  if (combined.includes('doctor') || combined.includes('dr.')) return 'Doctor';
  if (combined.includes('husband') || combined.includes('spouse')) return 'Husband';
  if (combined.includes('mother') || combined.includes('mom')) return 'Mother';
  if (combined.includes('father') || combined.includes('dad')) return 'Father';
  if (combined.includes('sister')) return 'Sister';
  if (combined.includes('brother')) return 'Brother';
  return 'Other';
}

export async function requestContactsPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Contacts.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

export async function scanDeviceIceContacts(): Promise<DeviceIceContact[]> {
  const granted = await requestContactsPermission();
  if (!granted) {
    throw new Error('Contacts permission is required to scan for emergency contacts.');
  }

  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Note],
  });

  const matches: DeviceIceContact[] = [];
  const seenPhones = new Set<string>();

  for (const contact of data) {
    const name = contact.name || '';
    const notes = contact.note || '';
    const isMatch =
      matchesIceKeyword(name) ||
      matchesIceKeyword(notes) ||
      (contact.firstName && matchesIceKeyword(contact.firstName)) ||
      (contact.lastName && matchesIceKeyword(contact.lastName));

    if (!isMatch) continue;

    const phones = extractPhoneNumbers(contact);
    for (const phone of phones) {
      if (seenPhones.has(phone)) continue;
      seenPhones.add(phone);
      matches.push({
        name: name || 'Emergency Contact',
        phone,
        relation: inferRelation(name, notes),
      });
    }
  }

  return matches;
}

export async function syncDeviceContactsToBackend(): Promise<EmergencyContact[]> {
  const deviceContacts = await scanDeviceIceContacts();

  if (deviceContacts.length === 0) {
    return emergencyService.getContacts();
  }

  const existing = await emergencyService.getContacts();
  const existingPhones = new Set(existing.flatMap((c) => [c.phone, c.whatsapp]));

  let updatedContacts = existing;
  let priority = existing.length + 1;

  for (const dc of deviceContacts) {
    if (existingPhones.has(dc.phone)) continue;

    updatedContacts = await emergencyService.addContact({
      name: dc.name,
      relation: dc.relation,
      phone: dc.phone,
      whatsapp: dc.phone,
      priority: Math.min(priority, 3),
    });
    existingPhones.add(dc.phone);
    priority++;
  }

  return updatedContacts;
}

export async function syncDeviceContactsWithFeedback(): Promise<EmergencyContact[]> {
  try {
    const contacts = await syncDeviceContactsToBackend();
    return contacts;
  } catch (err: any) {
    Alert.alert('Sync Failed', err.message || 'Unable to sync device contacts.');
    throw err;
  }
}

export default {
  requestContactsPermission,
  scanDeviceIceContacts,
  syncDeviceContactsToBackend,
  syncDeviceContactsWithFeedback,
};
