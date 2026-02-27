import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { apiClient } from '@/lib/api';
import Colors from '@/constants/colors';

interface PendingPlaylist {
  id: string;
  name: string;
  description: string;
  subject: string;
  department: string;
  academic_year: number;
  class_section: string;
  visibility: string;
  status: string;
  moderation_status: string;
  user_id: string;
  created_at: string;
  user?: {
    username: string;
    display_name: string;
  };
}

export default function ApprovalScreen() {
  const { user } = useAuth();
  const { playPlaylist } = usePlayer();
  const [pendingPlaylists, setPendingPlaylists] = useState<PendingPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  // Redirect non-teachers
  useEffect(() => {
    if (user && user.academicRole !== 'TEACHER' && user.role !== 'admin') {
      Alert.alert(
        'Access Denied',
        'This tab is only available for teachers and administrators.',
        [{ text: 'OK' }]
      );
    }
  }, [user]);

  const fetchPendingPlaylists = async () => {
    if (!user || (user.academicRole !== 'TEACHER' && user.role !== 'admin')) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/api/playlists/pending-approval');
      // Ensure we have an array even if the API returns undefined or null
      const playlists = response.data || [];
      setPendingPlaylists(Array.isArray(playlists) ? playlists : []);
    } catch (error) {
      console.error('Error fetching pending playlists:', error);
      Alert.alert('Error', 'Failed to fetch pending playlists');
      // Set empty array on error to prevent filter issues
      setPendingPlaylists([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingPlaylists();
  }, [user]);

  const handleApprove = async (playlistId: string) => {
    try {
      console.log('Approving playlist:', playlistId);
      await apiClient.patch(`/api/playlists/${playlistId}/approve`);
      Alert.alert('Success', 'Playlist approved successfully');
      // Refresh the list to remove the approved playlist
      fetchPendingPlaylists();
    } catch (error) {
      console.error('Error approving playlist:', error);
      Alert.alert('Error', 'Failed to approve playlist');
    }
  };

  const handleListen = async (playlistId: string) => {
    try {
      setPreviewLoading(playlistId);
      const response = await apiClient.get(`/api/playlists/${playlistId}/tracks`);
      const tracks = response.data || [];

      if (tracks.length === 0) {
        Alert.alert('Empty Playlist', 'This playlist has no tracks to listen to.');
        return;
      }

      await playPlaylist(tracks);
    } catch (error) {
      console.error('Error fetching tracks for preview:', error);
      Alert.alert('Error', 'Failed to load tracks for listening.');
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleReject = async (playlistId: string, playlistName: string) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Reject Playlist',
        `Please provide a reason for rejecting "${playlistName}":`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async (reason: string | undefined) => {
              await performReject(playlistId, reason || 'No reason provided');
            },
          },
        ],
        'plain-text'
      );
    } else {
      // For Android, we use a simple alert with a pre-filled reason or just prompt if available
      // Actually, standard Alert.alert doesn't have an input. 
      // For now, let's just use a simple rejection and maybe implement a proper modal later if needed.
      Alert.alert(
        'Reject Playlist',
        `Are you sure you want to reject "${playlistName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async () => {
              await performReject(playlistId, 'Rejected by teacher');
            },
          },
        ]
      );
    }
  };

  const performReject = async (playlistId: string, reason: string) => {
    try {
      await apiClient.patch(`/api/playlists/${playlistId}/reject`, {
        reason: reason.trim(),
      });
      Alert.alert('Success', 'Playlist rejected successfully');
      fetchPendingPlaylists();
    } catch (error) {
      console.error('Error rejecting playlist:', error);
      Alert.alert('Error', 'Failed to reject playlist');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPendingPlaylists();
  };

  const filteredPlaylists = (pendingPlaylists || []).filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (playlist.description && playlist.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (playlist.subject && playlist.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (playlist.user?.username && playlist.user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="log-in-outline" size={64} color={Colors.dark.textMuted} />
        <Text style={styles.messageText}>Please log in to continue</Text>
      </View>
    );
  }

  if (user.academicRole !== 'TEACHER' && user.role !== 'admin') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed-outline" size={64} color={Colors.dark.textMuted} />
        <Text style={styles.messageText}>Teacher Access Required</Text>
        <Text style={styles.subText}>This tab is only available for teachers and administrators</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
        <Text style={styles.loadingText}>Loading pending playlists...</Text>
      </View>
    );
  }

  const renderPlaylistItem = ({ item }: { item: PendingPlaylist }) => (
    <View style={styles.playlistCard}>
      <View style={styles.playlistHeader}>
        <View style={styles.playlistInfo}>
          <Text style={styles.playlistName}>{item.name}</Text>
          <Text style={styles.playlistDescription}>{item.description}</Text>
          {item.subject && (
            <Text style={styles.playlistSubject}>Subject: {item.subject}</Text>
          )}
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>PENDING</Text>
        </View>
      </View>

      <View style={styles.playlistDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={Colors.dark.textMuted} />
          <Text style={styles.detailText}>
            {item.user?.display_name || item.user?.username || 'Unknown'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={16} color={Colors.dark.textMuted} />
          <Text style={styles.detailText}>
            {item.department} - Year {item.academic_year} - Section {item.class_section}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={Colors.dark.textMuted} />
          <Text style={styles.detailText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.listenButton]}
          onPress={() => handleListen(item.id)}
          disabled={previewLoading === item.id}
        >
          {previewLoading === item.id ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="play-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Listen</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReject(item.id, item.name)}
        >
          <Ionicons name="close-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleApprove(item.id)}
        >
          <Ionicons name="checkmark-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Playlist Approval</Text>
        <Text style={styles.subtitle}>
          Review class playlists submitted by students
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.dark.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search playlists..."
          placeholderTextColor={Colors.dark.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        style={styles.content}
        data={filteredPlaylists}
        renderItem={renderPlaylistItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          filteredPlaylists.length === 0 && { flex: 1, justifyContent: 'center' }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={Colors.dark.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No playlists found matching your search' : 'No pending playlists'}
            </Text>
            <Text style={styles.emptySubText}>
              {searchQuery ? 'Try a different search term' : 'All caught up! No playlists need approval.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.dark.textMuted,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
    fontFamily: 'Poppins_400Regular',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  playlistCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  playlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  playlistInfo: {
    flex: 1,
    marginRight: 12,
  },
  playlistName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  playlistDescription: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginBottom: 8,
    lineHeight: 20,
  },
  playlistSubject: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: Colors.dark.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  playlistDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: Colors.dark.textMuted,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: Colors.dark.danger,
  },
  approveButton: {
    backgroundColor: Colors.dark.success,
  },
  listenButton: {
    backgroundColor: Colors.dark.textSecondary,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
