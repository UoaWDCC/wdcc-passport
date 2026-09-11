// GLSL sources are imported as strings (raw-loader, see next.config.ts).
declare module "*.frag" {
  const src: string;
  export default src;
}
declare module "*.vert" {
  const src: string;
  export default src;
}
declare module "*.glsl" {
  const src: string;
  export default src;
}
