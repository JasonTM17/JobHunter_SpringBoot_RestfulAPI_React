import '@testing-library/jest-dom';

// ── Next.js router mock ──────────────────────────────────────────────────────
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn(),
  query: {},
  pathname: '/',
  asPath: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  beforePopState: jest.fn(),
  isReady: true,
  basePath: '',
  locale: 'vi',
  locales: ['vi', 'en'],
  defaultLocale: 'vi',
  isLocaleDomain: false,
  isPreview: false,
  isFallback: false,
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockRouter.pathname,
  useSearchParams: () => new URLSearchParams(),
  withRouter: (Component: React.ComponentType) => Component,
}));

// ── Next.js Image mock ───────────────────────────────────────────────────────
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

// ── next/link mock ─────────────────────────────────────────────────────────
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// ── window.matchMedia mock ─────────────────────────────────────────────────
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ── IntersectionObserver mock ────────────────────────────────────────────────
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  disconnect = jest.fn();
  observe = jest.fn();
  takeRecords = (): IntersectionObserverEntry[] => [];
  unobserve = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// ── ResizeObserver mock ─────────────────────────────────────────────────────
class MockResizeObserver implements ResizeObserver {
  disconnect = jest.fn();
  observe = jest.fn();
  unobserve = jest.fn();
  reportOnResize = true;
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});
