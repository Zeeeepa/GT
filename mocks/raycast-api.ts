// Mock implementation of @raycast/api for components that depend on it
export const Icon = {
  Circle: "circle",
  Dot: "dot",
  CheckCircle: "check-circle",
  XCircle: "x-circle",
  Clock: "clock",
  Warning: "warning",
  QuestionMark: "question-mark",
};

export const Color = {
  Red: "red",
  Orange: "orange",
  Yellow: "yellow",
  Green: "green",
  Blue: "blue",
  Purple: "purple",
  Magenta: "magenta",
  PrimaryText: "primaryText",
  SecondaryText: "secondaryText",
};

export const environment = {
  canAccess: (url: string) => true,
  supportPath: "/support",
  assetsPath: "/assets",
  raycastVersion: "1.0.0",
};

export const getPreferenceValues = () => ({
  theme: "light",
});

export const showToast = (options: any) => {
  console.log("Toast:", options);
};

export const showHUD = (message: string) => {
  console.log("HUD:", message);
};

export const Keyboard = {
  Shortcut: {
    Cmd: "⌘",
    Shift: "⇧",
    Opt: "⌥",
    Ctrl: "⌃",
  },
};

export const ActionPanel = {
  Item: ({ title, onAction }: { title: string; onAction: () => void }) => null,
  Section: ({ children }: { children: any }) => null,
};

export const Action = {
  Push: ({ title, target }: { title: string; target: any }) => null,
  OpenInBrowser: ({ url }: { url: string }) => null,
  CopyToClipboard: ({ content }: { content: string }) => null,
};

export const List = {
  Item: ({ title, icon, accessories, actions }: { title: string; icon?: string; accessories?: any[]; actions?: any }) => null,
  EmptyView: ({ title, description, icon }: { title: string; description?: string; icon?: string }) => null,
};

export const Detail = {
  Metadata: {
    Item: ({ title, text }: { title: string; text: string }) => null,
    TagList: ({ title, tags }: { title: string; tags: string[] }) => null,
  },
};

export const Form = {
  TextField: ({ id, title, placeholder, value, onChange }: { id: string; title: string; placeholder?: string; value?: string; onChange?: (value: string) => void }) => null,
  TextArea: ({ id, title, placeholder, value, onChange }: { id: string; title: string; placeholder?: string; value?: string; onChange?: (value: string) => void }) => null,
  Dropdown: ({ id, title, value, onChange, children }: { id: string; title: string; value?: string; onChange?: (value: string) => void; children: React.ReactNode }) => null,
  Separator: () => null,
  Description: ({ title, text }: { title?: string; text: string }) => null,
};

export default {
  Icon,
  Color,
  environment,
  getPreferenceValues,
  showToast,
  showHUD,
  Keyboard,
  ActionPanel,
  Action,
  List,
  Detail,
  Form,
};
