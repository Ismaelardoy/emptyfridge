import { notifyItemAdded } from '@/shared/lib/pwa-install';
import { queryKeys } from '@/shared/lib/query-keys';
import type {
  CurrentListDto,
  FinishListResultDto,
  ItemDto,
  ItemResponseDto,
} from '@emptyfridge/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  addItem,
  deleteItem,
  finishList,
  getCurrentList,
  getMostUsed,
  reopenList,
  updateItem,
} from './api';

export function useCurrentList() {
  return useQuery({
    queryKey: queryKeys.currentList,
    queryFn: getCurrentList,
    refetchInterval: 3_000,
    refetchIntervalInBackground: false,
    staleTime: 3_000,
    // El sondeo de cada 3 s cambia `isFetching` aunque la lista sea idéntica.
    // Sin esto, cada ciclo repinta la lista entera dos veces (ida y vuelta) y
    // en un móvil con muchos productos se nota como tirones al tocar.
    notifyOnChangeProps: ['data', 'isLoading', 'isError', 'error'],
  });
}

export function useMostUsed() {
  return useQuery({
    queryKey: queryKeys.mostUsed,
    queryFn: getMostUsed,
    staleTime: 30_000,
  });
}

export function useAddItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addItem,
    onSuccess: (result) => {
      if (!result.created) {
        toast('Ese producto ya estaba en la lista');
      } else {
        notifyItemAdded();
      }

      const current = queryClient.getQueryData<CurrentListDto>(queryKeys.currentList);
      if (current?.list && current.list.id === result.item.listId) {
        queryClient.setQueryData<CurrentListDto>(queryKeys.currentList, {
          ...current,
          list: {
            ...current.list,
            items: [
              result.item,
              ...current.list.items.filter((item) => item.id !== result.item.id),
            ],
          },
          recentAdditions: result.created
            ? [
                {
                  id: result.item.id,
                  itemName: result.item.name,
                  addedBy: result.item.addedBy,
                  createdAt: result.item.createdAt,
                },
                ...(current.recentAdditions ?? []).filter((entry) => entry.id !== result.item.id),
              ].slice(0, 15)
            : (current.recentAdditions ?? []),
        });
      } else {
        void queryClient.invalidateQueries({ queryKey: queryKeys.currentList });
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.mostUsed });
    },
    onError: (error) => toast.error(error.message),
  });
}

interface ToggleItemVariables {
  id: string;
  checked: boolean;
}

interface OptimisticContext {
  previous: CurrentListDto | undefined;
}

export function useToggleItem() {
  const queryClient = useQueryClient();

  return useMutation<ItemResponseDto, Error, ToggleItemVariables, OptimisticContext>({
    mutationFn: ({ id, checked }) => updateItem(id, { checked }),
    onMutate: async ({ id, checked }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.currentList });
      const previous = queryClient.getQueryData<CurrentListDto>(queryKeys.currentList);

      queryClient.setQueryData<CurrentListDto>(queryKeys.currentList, (old) =>
        old?.list
          ? {
              ...old,
              list: {
                ...old.list,
                items: old.list.items.map((item) => (item.id === id ? { ...item, checked } : item)),
              },
            }
          : old,
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.currentList, context.previous);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.currentList });
      void queryClient.invalidateQueries({ queryKey: queryKeys.mostUsed });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, ItemDto, OptimisticContext>({
    mutationFn: (item) => deleteItem(item.id),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.currentList });
      const previous = queryClient.getQueryData<CurrentListDto>(queryKeys.currentList);

      queryClient.setQueryData<CurrentListDto>(queryKeys.currentList, (old) =>
        old?.list
          ? {
              ...old,
              list: {
                ...old.list,
                items: old.list.items.filter((entry) => entry.id !== item.id),
              },
              recentAdditions: (old.recentAdditions ?? []).filter((entry) => entry.id !== item.id),
            }
          : old,
      );

      return { previous };
    },
    onError: (error, _item, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.currentList, context.previous);
      }
      toast.error(error.message);
    },
    onSuccess: (_data, item) => {
      toast('Producto eliminado', {
        action: {
          label: 'Deshacer',
          onClick: () => {
            void addItem({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
            }).then(() => {
              void queryClient.invalidateQueries({ queryKey: queryKeys.currentList });
            });
          },
        },
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.currentList });
      void queryClient.invalidateQueries({ queryKey: queryKeys.mostUsed });
    },
  });
}

export function useFinishList() {
  const queryClient = useQueryClient();

  return useMutation<FinishListResultDto, Error, void>({
    mutationFn: () => finishList(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('Compra finalizada. Puedes revertirla durante 30 minutos.');
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useReopenList() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: reopenList,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('Compra revertida. La lista vuelve a estar abierta.');
    },
    onError: (error) => toast.error(error.message),
  });
}
