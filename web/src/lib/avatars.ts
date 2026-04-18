// 6 аватаров — PNG-картинки
export interface AvatarOption {
  id: string;
  label: string;
  src: string;
}

export const AVATARS: AvatarOption[] = [
  { id: 'gamer',     label: 'Геймер',           src: '/avatars/gamer.png' },
  { id: 'traveler',  label: 'Путешественник',   src: '/avatars/traveler.png' },
  { id: 'sportsman', label: 'Спортсмен',        src: '/avatars/sportsman.png' },
  { id: 'artist',    label: 'Художник',         src: '/avatars/artist.png' },
  { id: 'techie',    label: 'Технарь',          src: '/avatars/techie.png' },
  { id: 'musician',  label: 'Музыкант',         src: '/avatars/musician.png' },
];
