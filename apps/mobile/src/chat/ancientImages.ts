import { Image, type ImageSourcePropType } from "react-native";

const LOCAL_ANCIENT_IMAGES: Record<string, ImageSourcePropType> = {
  cleopatra: require("../../assets/ancients/cleopatra.png"),
  confucius: require("../../assets/ancients/confucius.png"),
  socrates: require("../../assets/ancients/socrates.png"),
};

export const getAncientInitials = (name: string) => name.slice(0, 2).toUpperCase();

export const getAncientImageSource = (
  slug: string,
  avatarUrl: string | null | undefined,
): ImageSourcePropType | null => {
  const localImage = LOCAL_ANCIENT_IMAGES[slug];
  if (localImage) return localImage;
  if (avatarUrl) return { uri: avatarUrl };
  return null;
};

export const getAncientWebImageUrl = (
  slug: string,
  avatarUrl: string | null | undefined,
): string | null => {
  const source = getAncientImageSource(slug, avatarUrl);
  if (!source) return null;

  if (typeof source === "number") {
    const resolved = Image.resolveAssetSource(source);
    return resolved?.uri ?? null;
  }

  return source.uri ?? null;
};
