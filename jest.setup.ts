import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock window.crypto for Bitcoin operations
Object.defineProperty(window, "crypto", {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
    readText: jest.fn(),
  },
});

// Mock file download
global.URL.createObjectURL = jest.fn(() => "mock-url");
global.URL.revokeObjectURL = jest.fn();

// Mock Blob
global.Blob = jest.fn((content, options) => ({
  content,
  options,
  size: Array.isArray(content) && content[0] ? String(content[0]).length : 0,
  type: options?.type || "",
  arrayBuffer: jest.fn(),
  bytes: jest.fn(),
  slice: jest.fn(),
  stream: jest.fn(),
  text: jest.fn(),
}));

// Mock document methods for download functionality
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

Object.defineProperty(document, "createElement", {
  value: mockCreateElement.mockReturnValue({
    click: mockClick,
    href: "",
    download: "",
  }),
});

Object.defineProperty(document.body, "appendChild", {
  value: mockAppendChild,
});

Object.defineProperty(document.body, "removeChild", {
  value: mockRemoveChild,
});
