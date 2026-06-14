export function isOverDropZone(card: DOMRect, zone: DOMRect) {
  return !(
    card.right < zone.left ||
    card.left > zone.right ||
    card.bottom < zone.top ||
    card.top > zone.bottom
  );
}