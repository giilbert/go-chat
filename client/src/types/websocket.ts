// makes a Record<K, V> a union of all its variants
// based on the serde tagged enum pattern
export type TaggedEnum<T> = {
  [K in keyof T]: { type: K; data: T[K] };
}[keyof T];

export type Author = {
  id: string;
  name: string;
};

export type Out = TaggedEnum<{
  Handshake: {
    name: string;
  };
  Send: {
    message: string;
  };
}>;

export type In = TaggedEnum<{
  Message: Message;
}>;

export type Message = {
  from: Author;
  message: string;
};
