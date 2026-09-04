/**
 * Full-viewport photographic backdrop that every glass surface sits on.
 *
 * Fixed rather than scrolling, so long pages do not drag a large blurred
 * composite up the screen — that is the expensive case for backdrop-filter.
 *
 * The photograph is layered over a gradient of matching tonality, so a
 * missing or slow-loading file degrades to something that still reads as a
 * field at dusk. Drop the image at public/images/hero-farmer.jpg.
 */
export function PhotoBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-50" aria-hidden="true">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/images/hero-farmer.jpg'), radial-gradient(120% 90% at 70% 10%, #5c7f45 0%, #2c4224 45%, #0f1710 100%)",
        }}
      />
      {/*
        Scrim. Guarantees the text floor whatever photograph is dropped in —
        a headline legible over one image can vanish over the next.
      */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,15,11,0.82)_0%,rgba(10,15,11,0.70)_45%,rgba(10,15,11,0.92)_100%)]" />
    </div>
  );
}
