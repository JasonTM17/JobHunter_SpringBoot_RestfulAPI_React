import {
  createId,
  formatCurrencyVnd,
  formatDateVi,
  formatLevelLabel,
  formatLocationLabel,
  stripHtml,
  shortText,
  sanitizeRichText,
  splitDescriptionSections,
  resolveCompanyLogo,
  getInitials,
  formatPermissionName,
  formatModuleName,
  toDateInput,
  toIsoDate,
} from "../../utils/format";

describe("format utilities", () => {
  describe("createId", () => {
    it("returns a string prefixed with the given prefix", () => {
      const id = createId("test");
      expect(id.startsWith("test-")).toBe(true);
    });

    it("returns unique ids on repeated calls", () => {
      const id1 = createId("test");
      const id2 = createId("test");
      expect(id1).not.toBe(id2);
    });
  });

  describe("formatCurrencyVnd", () => {
    it("returns 'Thoa thuan' for null/undefined/NaN", () => {
      expect(formatCurrencyVnd(null)).toBe("Thoa thuan");
      expect(formatCurrencyVnd(undefined)).toBe("Thoa thuan");
      expect(formatCurrencyVnd(NaN)).toBe("Thoa thuan");
    });

    it("formats a number in VND currency", () => {
      const result = formatCurrencyVnd(15000000);
      expect(result).toContain("15");
      expect(result).toContain("VND");
    });

    it("returns 'Thoa thuan' for 0", () => {
      expect(formatCurrencyVnd(0)).toBe("Thoa thuan");
    });
  });

  describe("formatDateVi", () => {
    it("returns 'Dang cap nhat' for null/undefined/invalid date", () => {
      expect(formatDateVi(null)).toBe("Dang cap nhat");
      expect(formatDateVi(undefined)).toBe("Dang cap nhat");
      expect(formatDateVi("invalid-date")).toBe("Dang cap nhat");
    });

    it("formats a valid ISO date string", () => {
      const result = formatDateVi("2026-03-15T10:30:00Z");
      expect(result).toContain("15");
      expect(result).toContain("2026");
    });
  });

  describe("formatLevelLabel", () => {
    it("returns 'Chua cap nhat' for null/undefined", () => {
      expect(formatLevelLabel(null)).toBe("Chua cap nhat");
      expect(formatLevelLabel(undefined)).toBe("Chua cap nhat");
    });

    it("maps INTERN to 'Thuc tap'", () => {
      expect(formatLevelLabel("INTERN")).toBe("Thuc tap");
      expect(formatLevelLabel("intern")).toBe("Thuc tap");
    });

    it("maps FRESHER to 'Moi di lam'", () => {
      expect(formatLevelLabel("FRESHER")).toBe("Moi di lam");
    });

    it("maps JUNIOR to 'Junior'", () => {
      expect(formatLevelLabel("JUNIOR")).toBe("Junior");
    });

    it("maps SENIOR to 'Senior'", () => {
      expect(formatLevelLabel("SENIOR")).toBe("Senior");
    });

    it("maps MIDDLE to 'Middle'", () => {
      expect(formatLevelLabel("MIDDLE")).toBe("Middle");
    });

    it("maps CHUA_CAP_NHAT to 'Chua cap nhat'", () => {
      expect(formatLevelLabel("CHUA_CAP_NHAT")).toBe("Chua cap nhat");
    });

    it("returns original value for unknown levels", () => {
      expect(formatLevelLabel("UNKNOWN_LEVEL")).toBe("UNKNOWN_LEVEL");
    });
  });

  describe("formatLocationLabel", () => {
    it("returns 'Chua cap nhat' for null/undefined", () => {
      expect(formatLocationLabel(null)).toBe("Chua cap nhat");
      expect(formatLocationLabel(undefined)).toBe("Chua cap nhat");
    });

    it("maps REMOTE to 'Lam viec tu xa'", () => {
      expect(formatLocationLabel("REMOTE")).toBe("Lam viec tu xa");
    });

    it("maps HANOI to 'Ha Noi'", () => {
      expect(formatLocationLabel("HANOI")).toBe("Ha Noi");
    });

    it("maps HOCHIMINH and variants to 'TP. Ho Chi Minh'", () => {
      expect(formatLocationLabel("HOCHIMINH")).toBe("TP. Ho Chi Minh");
      expect(formatLocationLabel("HCM")).toBe("TP. Ho Chi Minh");
      expect(formatLocationLabel("TPHCM")).toBe("TP. Ho Chi Minh");
    });

    it("maps DANANG to 'Da Nang'", () => {
      expect(formatLocationLabel("DANANG")).toBe("Da Nang");
    });

    it("returns original value for unknown locations", () => {
      expect(formatLocationLabel("CANTHO")).toBe("CANTHO");
    });
  });

  describe("stripHtml", () => {
    it("returns empty string for null/undefined", () => {
      expect(stripHtml(null)).toBe("");
      expect(stripHtml(undefined)).toBe("");
    });

    it("strips HTML tags from a string", () => {
      expect(stripHtml("<p>Hello <b>World</b></p>")).toBe("Hello World");
    });

    it("collapses whitespace", () => {
      expect(stripHtml("<p>  Hello  <i>  World  </i>  </p>")).toBe("Hello World");
    });
  });

  describe("shortText", () => {
    it("returns original string if shorter than limit", () => {
      expect(shortText("Hello", 10)).toBe("Hello");
    });

    it("truncates and appends ... if longer than limit", () => {
      const result = shortText("Hello World", 5);
      expect(result.length).toBeLessThanOrEqual(5 + 3);
      expect(result.endsWith("...")).toBe(true);
    });
  });

  describe("sanitizeRichText", () => {
    it("returns empty string for null/undefined", () => {
      expect(sanitizeRichText(null)).toBe("");
      expect(sanitizeRichText(undefined)).toBe("");
    });

    it("removes script tags", () => {
      const result = sanitizeRichText('<p>Hello</p><script>alert("xss")</script>');
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
    });

    it("removes inline event handlers", () => {
      const result = sanitizeRichText('<img src="x" onerror="alert(1)">');
      expect(result).not.toContain("onerror");
    });

    it("removes javascript: URLs", () => {
      const result = sanitizeRichText('<a href="javascript:alert(1)">click</a>');
      expect(result).not.toContain("javascript:");
    });
  });

  describe("splitDescriptionSections", () => {
    it("returns empty sections for null/undefined", () => {
      const result = splitDescriptionSections(null);
      expect(result).toEqual({ description: "", requirements: "", benefits: "" });
    });

    it("splits HTML by heading tags", () => {
      const html = `
        <h3>Mo ta cong viec</h3>
        <p>Mo ta noi dung.</p>
        <h3>Yeu cau</h3>
        <p>Cac yeu cau ky nang.</p>
        <h3>Quyen loi</h3>
        <p>Cac quyen loi.</p>
      `;
      const result = splitDescriptionSections(html);
      expect(result.description).toContain("Mo ta noi dung");
      expect(result.requirements).toContain("yeu cau ky nang");
      expect(result.benefits).toContain("quyen loi");
    });

    it("returns full HTML as description if no headings", () => {
      const html = "<p>Plain paragraph without headings.</p>";
      const result = splitDescriptionSections(html);
      expect(result.description).toContain("Plain paragraph");
    });
  });

  describe("getInitials", () => {
    it("returns initials from a name", () => {
      expect(getInitials("Nguyen Van A")).toBe("NV");
    });

    it("returns 'JT' for null/undefined", () => {
      expect(getInitials(null)).toBe("JT");
      expect(getInitials(undefined)).toBe("JT");
    });

    it("returns single initial for single-word name", () => {
      expect(getInitials("Nguyen")).toBe("N");
    });

    it("limits to two initials", () => {
      expect(getInitials("Nguyen Van A B C")).toBe("NV");
    });
  });

  describe("toDateInput", () => {
    it("returns empty string for null/undefined", () => {
      expect(toDateInput(null)).toBe("");
      expect(toDateInput(undefined)).toBe("");
    });

    it("returns ISO date string (date part only)", () => {
      const result = toDateInput("2026-03-15T10:30:00Z");
      expect(result).toBe("2026-03-15");
    });
  });

  describe("toIsoDate", () => {
    it("returns null for empty string", () => {
      expect(toIsoDate("")).toBe(null);
    });

    it("converts a date string to ISO format", () => {
      const result = toIsoDate("2026-03-15");
      expect(result).toMatch(/^2026-03-15T00:00:00/);
    });

    it("returns null for invalid input", () => {
      expect(toIsoDate("not-a-date")).toBe(null);
    });
  });
});
