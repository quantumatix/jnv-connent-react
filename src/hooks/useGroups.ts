import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi, type CreateGroupPayload } from '@/api/groupApi';

export function useGroups() {
    const queryClient = useQueryClient();

    // Queries
    const myGroupsQuery = useQuery({
        queryKey: ['myGroups'],
        queryFn: groupApi.listMyGroups,
    });

    const discoverGroupsQuery = useQuery({
        queryKey: ['discoverGroups'],
        queryFn: groupApi.discoverGroups,
    });

    // Mutations
    const createGroupMutation = useMutation({
        mutationFn: (payload: CreateGroupPayload) => groupApi.createGroup(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });

    const joinGroupMutation = useMutation({
        mutationFn: (groupId: string) => groupApi.joinGroup(groupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });

    const leaveGroupMutation = useMutation({
        mutationFn: (groupId: string) => groupApi.leaveGroup(groupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] });
        },
    });

    return {
        // Queries
        groups: myGroupsQuery.data ?? [],
        isLoadingGroups: myGroupsQuery.isLoading,
        groupsError: myGroupsQuery.error,
        fetchGroups: myGroupsQuery.refetch,

        // Mutations
        createGroup: createGroupMutation.mutateAsync,
        joinGroup: joinGroupMutation.mutateAsync,
        leaveGroup: leaveGroupMutation.mutateAsync,

        // Loading states
        isCreatingGroup: createGroupMutation.isPending,
        isJoiningGroup: joinGroupMutation.isPending,
        isLeavingGroup: leaveGroupMutation.isPending,

        // Discover groups (public, unjoined)
        discoverGroups: discoverGroupsQuery.data ?? [],
        isLoadingDiscover: discoverGroupsQuery.isLoading,
    };
}
