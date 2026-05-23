import { ref, watch, onBeforeUnmount, type Ref } from 'vue';
import { fetchCandidateAvatarBlobUrl } from '@/src/api/candidates';
import {
  isExternalCandidatePhotoUrl,
} from '@/utils/candidatePhoto';

const DEFAULT_AVATAR_SRC = '/img/default-avatar.png';

export function useCandidatePhotoSrc(
  candidateId: Ref<number | undefined>,
  imagePath: Ref<string | null | undefined>,
  vacancyId?: Ref<number | string | null | undefined>
) {
  const photoSrc = ref(DEFAULT_AVATAR_SRC);
  const isPlaceholder = ref(true);
  const isLoading = ref(false);
  let blobUrl: string | null = null;

  function revokeBlob() {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      blobUrl = null;
    }
  }

  async function resolvePhoto() {
    revokeBlob();
    const path = imagePath.value?.trim() ?? '';
    const id = candidateId.value;

    if (!path) {
      photoSrc.value = DEFAULT_AVATAR_SRC;
      isPlaceholder.value = true;
      isLoading.value = false;
      return;
    }

    if (!isExternalCandidatePhotoUrl(path)) {
      photoSrc.value = path;
      isPlaceholder.value = false;
      isLoading.value = false;
      return;
    }

    if (!id) {
      photoSrc.value = DEFAULT_AVATAR_SRC;
      isPlaceholder.value = true;
      isLoading.value = false;
      return;
    }

    isLoading.value = true;
    try {
      const url = await fetchCandidateAvatarBlobUrl(
        id,
        vacancyId?.value ?? undefined
      );
      blobUrl = url;
      photoSrc.value = url;
      isPlaceholder.value = false;
    } catch {
      photoSrc.value = DEFAULT_AVATAR_SRC;
      isPlaceholder.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  watch(
    [candidateId, imagePath, () => vacancyId?.value],
    () => {
      void resolvePhoto();
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    revokeBlob();
  });

  function onPhotoError() {
    photoSrc.value = DEFAULT_AVATAR_SRC;
    isPlaceholder.value = true;
  }

  return { photoSrc, isPlaceholder, isLoading, onPhotoError };
}
