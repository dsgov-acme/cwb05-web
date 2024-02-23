export interface ITag {
  label: string;
  textColor?: `#${string}` | `--${string}`;
  backgroundColor?: `#${string}` | `--${string}`;
  borderColor?: `#${string}` | `--${string}`;
  icon?: string;
  iconColor?: `#${string}` | `--${string}`;
}
