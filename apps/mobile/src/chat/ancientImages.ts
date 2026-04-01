import { Image, type ImageSourcePropType } from "react-native";

const LOCAL_ANCIENT_IMAGES: Record<string, ImageSourcePropType> = {
  "alexander-the-great": require("../../assets/ancients/alexander-the-great.png"),
  aristotle: require("../../assets/ancients/aristotle.png"),
  ashoka: require("../../assets/ancients/ashoka.png"),
  augustus: require("../../assets/ancients/augustus.png"),
  buddha: require("../../assets/ancients/siddhartha-gautama.png"),
  cleopatra: require("../../assets/ancients/cleopatra.png"),
  confucius: require("../../assets/ancients/confucius.png"),
  "hannibal-barca": require("../../assets/ancients/hannibal-barca.png"),
  hypatia: require("../../assets/ancients/Hypatia.png"),
  "julius-caesar": require("../../assets/ancients/julius-caesar.png"),
  plato: require("../../assets/ancients/plato.png"),
  socrates: require("../../assets/ancients/socrates.png"),
  "sun-tzu": require("../../assets/ancients/sun-tzu.png"),
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

  if (Array.isArray(source)) return source[0]?.uri ?? null;
  return source.uri ?? null;
};
