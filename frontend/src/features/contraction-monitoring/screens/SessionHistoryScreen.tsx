import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import Theme from '../../../core/theme/theme';
import { Heading, Subheading, BodyText, Caption } from '../../../core/components/Typography';
import { Card } from '../../../core/components/Card';
import { Button } from '../../../core/components/Button';
import contractionApi from '../api/contractionApi';

interface SessionItem {
  session: {
    _id: string;
    startTime: string;
    endTime?: string;
    status: string;
    notes?: string;
  };
  stats: {
    totalContractions: number;
    averageDuration: number;
    averageInterval: number;
    peakIntensity: number;
    sessionDurationMinutes: number;
  };
}

export const SessionHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // State to support comparison overlay checkbox selections
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await contractionApi.getSessions({
        limit: 15,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setSessions(data.sessions || []);
    } catch (err: any) {
      console.error('❌ Error loading history list:', err);
      Alert.alert('Load Error', 'Failed to retrieve historical session logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [search, startDate, endDate]);

  const toggleSelectForComparison = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(-2) // Limit comparison selections to maximum 2 sessions
    );
  };

  const handleCompare = () => {
    if (selectedIds.length !== 2) {
      Alert.alert('Compare Sessions', 'Please select exactly 2 sessions to compare trends.');
      return;
    }
    
    // Find the full items
    const compSessions = sessions.filter((s) => selectedIds.includes(s.session._id));
    
    Alert.alert(
      'Session Comparison',
      `Session A (${new Date(compSessions[0].session.startTime).toLocaleDateString()}):
• Contractions Count: ${compSessions[0].stats.totalContractions}
• Avg Duration: ${compSessions[0].stats.averageDuration}s
• Peak Tension: ${Math.round(compSessions[0].stats.peakIntensity)}%

Session B (${new Date(compSessions[1].session.startTime).toLocaleDateString()}):
• Contractions Count: ${compSessions[1].stats.totalContractions}
• Avg Duration: ${compSessions[1].stats.averageDuration}s
• Peak Tension: ${Math.round(compSessions[1].stats.peakIntensity)}%`
    );
  };

  const renderSessionItem = ({ item }: { item: SessionItem }) => {
    const isSelected = selectedIds.includes(item.session._id);
    const date = new Date(item.session.startTime).toLocaleDateString();
    const time = new Date(item.session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <Card style={[styles.sessionCard, ...(isSelected ? [styles.selectedCard] : [])]}>
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => toggleSelectForComparison(item.session._id)} style={styles.checkboxRow}>
            <View style={[styles.checkbox, isSelected && styles.checkedBox]} />
            <Subheading style={styles.sessionTitle}>{date} at {time}</Subheading>
          </TouchableOpacity>

          <Button
            title="View Details"
            variant="outline"
            size="small"
            onPress={() => navigation.navigate('SessionSummary', { sessionId: item.session._id })}
          />
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Caption>Count</Caption>
            <BodyText style={styles.metricVal}>{item.stats.totalContractions}</BodyText>
          </View>
          <View style={styles.metric}>
            <Caption>Avg Dur</Caption>
            <BodyText style={styles.metricVal}>{item.stats.averageDuration}s</BodyText>
          </View>
          <View style={styles.metric}>
            <Caption>Peak Intensity</Caption>
            <BodyText style={styles.metricVal}>{Math.round(item.stats.peakIntensity)}%</BodyText>
          </View>
          <View style={styles.metric}>
            <Caption>Length</Caption>
            <BodyText style={styles.metricVal}>{item.stats.sessionDurationMinutes}m</BodyText>
          </View>
        </View>

        {item.session.notes && (
          <Caption style={styles.notesText}>Notes: "{item.session.notes}"</Caption>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Heading style={styles.title}>Session History</Heading>
        <BodyText style={styles.subtitle}>
          Search, filter, and compare contraction monitoring trends.
        </BodyText>
      </View>

      {/* Filter and search bars */}
      <View style={styles.filtersSection}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes (e.g. walking, resting)..."
          placeholderTextColor={Theme.colors.textMuted}
          style={styles.searchInput}
        />
        <View style={styles.datesRow}>
          <TextInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="Start date (YYYY-MM-DD)"
            placeholderTextColor={Theme.colors.textMuted}
            style={styles.dateInput}
          />
          <TextInput
            value={endDate}
            onChangeText={setEndDate}
            placeholder="End date (YYYY-MM-DD)"
            placeholderTextColor={Theme.colors.textMuted}
            style={styles.dateInput}
          />
        </View>
      </View>

      {loading && sessions.length === 0 ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={styles.spinner} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.session._id}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Caption>No sessions match your search criteria.</Caption>
            </View>
          }
        />
      )}

      {selectedIds.length === 2 && (
        <View style={styles.comparisonFloatingBar}>
          <BodyText style={styles.floatingText}>2 sessions selected for comparison</BodyText>
          <Button title="Compare Trends" size="small" onPress={handleCompare} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: Theme.spacing.xxl,
    paddingBottom: Theme.spacing.md,
  },
  title: {
    color: Theme.colors.primaryDark,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  filtersSection: {
    paddingHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
  },
  searchInput: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borders.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderColor: Theme.colors.divider,
    borderWidth: 1,
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    marginBottom: Theme.spacing.sm,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borders.radius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderColor: Theme.colors.divider,
    borderWidth: 1,
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.sm,
    width: '48%',
  },
  spinner: {
    marginTop: 80,
  },
  list: {
    paddingHorizontal: Theme.spacing.xl,
    paddingBottom: 100,
  },
  sessionCard: {
    padding: Theme.spacing.lg,
  },
  selectedCard: {
    borderColor: Theme.colors.accent,
    borderWidth: Theme.borders.width.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Theme.colors.textMuted,
    marginRight: Theme.spacing.sm,
  },
  checkedBox: {
    backgroundColor: Theme.colors.accent,
    borderColor: Theme.colors.accent,
  },
  sessionTitle: {
    color: Theme.colors.text,
    fontSize: Theme.typography.sizes.base,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
    paddingTop: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  metric: {
    alignItems: 'center',
    width: '24%',
  },
  metricVal: {
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.primary,
    marginTop: 2,
  },
  notesText: {
    marginTop: Theme.spacing.md,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  comparisonFloatingBar: {
    position: 'absolute',
    bottom: Theme.spacing.lg,
    left: Theme.spacing.xl,
    right: Theme.spacing.xl,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: Theme.borders.radius.lg,
    padding: Theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: Theme.colors.accent,
    borderWidth: 1,
    ...Theme.shadows.medium,
  },
  floatingText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text,
  },
});
export default SessionHistoryScreen;
