// Must be a module (not ambient) so declare module augments instead of replacing React's types.
export {};

// Extend React HTML attribute types to include deprecated email-client attributes
// (bgcolor, valign) that are required for Outlook compatibility but missing from @types/react.
declare module "react" {
  interface HTMLAttributes<T> {
    bgcolor?: string;
    valign?: string;
  }
  interface TdHTMLAttributes<T> {
    bgcolor?: string;
    valign?: string;
  }
  interface TableHTMLAttributes<T> {
    bgcolor?: string;
  }
  interface ThHTMLAttributes<T> {
    bgcolor?: string;
    valign?: string;
  }
}
