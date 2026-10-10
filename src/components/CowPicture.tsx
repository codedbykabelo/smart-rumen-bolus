export function CowPicture({ transparentStomach }: { transparentStomach: boolean }) {
  return <img
    src={transparentStomach ? '/images/realistic-cow-cutaway-v1.webp' : '/images/realistic-cow-solid-v1.webp'}
    alt={transparentStomach
      ? 'Realistic Holstein cow with an educational stomach cutaway and smart capsule inside the reticulum'
      : 'Realistic black-and-white Holstein cow standing in a wooden cattle kraal'}
    className="h-full w-full object-contain"
    decoding="async"
    fetchPriority="high"
    draggable={false}
  />;
}
