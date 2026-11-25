const files=import.meta.glob('../assets/*.webp',{eager:true,query:'?url',import:'default'});
export const artURL=name=>files[`../assets/${name}.webp`]||files['../assets/workplace.webp'];
export const picture=(name,alt='')=>`<img class="painted-art" src="${artURL(name)}" alt="${alt}">`;
