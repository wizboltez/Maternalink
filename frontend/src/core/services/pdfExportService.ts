import { Platform, Alert } from 'react-native';
import RNPrint from 'react-native-print';
import ReactNativeBlobUtil from 'react-native-blob-util';
import contractionApi from '../../features/contraction-monitoring/api/contractionApi';
import { API_BASE_URL } from '../config/api';

export async function printSessionPdf(sessionId: string): Promise<void> {
  try {
    const token = contractionApi.getAuthToken();
    if (!token) {
      Alert.alert('Export Failed', 'You must be signed in to export a report.');
      return;
    }

    const fileName = `maternalink_session_${sessionId}.pdf`;
    const cachePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;

    const response = await ReactNativeBlobUtil.config({
      path: cachePath,
      fileCache: true,
      appendExt: 'pdf',
    }).fetch('GET', `${API_BASE_URL}/monitoring/export/pdf/${sessionId}`, {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
    });

    const status = response.info().status;
    if (status !== 200) {
      throw new Error(`Server returned status ${status}`);
    }

    const filePath = response.path();

    if (Platform.OS === 'android') {
      // Uses Android PrintManager under the hood
      await RNPrint.print({ filePath, jobName: `Maternalink Session Report` });
    } else {
      await RNPrint.print({ filePath });
    }
  } catch (err: any) {
    Alert.alert(
      'PDF Export Failed',
      err?.message || 'Unable to generate or print the session report.'
    );
  }
}
