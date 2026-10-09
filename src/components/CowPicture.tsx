export function CowPicture({ transparentStomach }: { transparentStomach: boolean }) {
  return <img
    src={transparentStomach ? '/images/realistic-cow-cutaway-v1.png' : '/images/realistic-cow-solid-v1.png'}
    alt={transparentStomach
      ? 'Realistic Holstein cow with an educational stomach cutaway and smart capsule inside the reticulum'
      : 'Realistic black-and-white Holstein cow standing in a wooden cattle kraal'}
    className="h-full w-full object-contain"
    draggable={false}
  />;
}
