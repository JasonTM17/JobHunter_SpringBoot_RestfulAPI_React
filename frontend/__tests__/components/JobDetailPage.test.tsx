import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/router";
import JobDetailPage from "../../pages/jobs/[id]";
import { useAuth } from "../../contexts/auth-context";
import { createResumeWithAuth, fetchCurrentUserResumesWithAuth } from "../../services/auth-rbac-api";
import { fetchJobDetail, uploadResumeFile } from "../../services/jobhunter-api";
import type { Job, ResumeItem } from "../../types/models";

jest.mock("next/router", () => ({
  useRouter: jest.fn()
}));

jest.mock("../../contexts/auth-context", () => ({
  useAuth: jest.fn()
}));

jest.mock("../../services/auth-rbac-api", () => ({
  createResumeWithAuth: jest.fn(),
  fetchCurrentUserResumesWithAuth: jest.fn()
}));

jest.mock("../../services/jobhunter-api", () => ({
  fetchJobDetail: jest.fn(),
  uploadResumeFile: jest.fn()
}));

const sampleJob: Job = {
  id: 48,
  name: "Senior Backend Engineer",
  location: "HOCHIMINH",
  salary: 42000000,
  quantity: 2,
  level: "SENIOR",
  active: true,
  endDate: "2099-12-31T00:00:00.000Z",
  description: "<p>Build reliable Java services.</p>",
  company: {
    id: 9,
    name: "Jobhunter Labs",
    address: "Ho Chi Minh City"
  },
  skills: [
    { id: 1, name: "Java" },
    { id: 2, name: "Spring Boot" }
  ]
};

const appliedResume: ResumeItem = {
  id: 17,
  email: "candidate@example.com",
  url: "https://example.com/cv.pdf",
  status: "REVIEWING",
  companyName: "Jobhunter Labs",
  createdDate: "2026-04-01T08:00:00.000Z",
  lastModifiedDate: "2026-04-02T10:30:00.000Z",
  lastModifiedBy: "recruiter@example.com",
  user: {
    id: 5,
    name: "Candidate One"
  },
  job: {
    id: 48,
    name: "Senior Backend Engineer"
  }
};

describe("JobDetailPage", () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      asPath: "/jobs/48",
      isReady: true,
      query: { id: "48" }
    });
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      currentUser: {
        id: 5,
        name: "Candidate One",
        email: "candidate@example.com"
      },
      can: jest.fn(() => true)
    });
    (fetchJobDetail as jest.Mock).mockResolvedValue(sampleJob);
    (uploadResumeFile as jest.Mock).mockResolvedValue({ fileUrl: "https://example.com/uploaded-cv.pdf" });
  });

  it("shows the existing application state instead of the apply form", async () => {
    (fetchCurrentUserResumesWithAuth as jest.Mock).mockResolvedValue([appliedResume]);

    render(<JobDetailPage initialJob={sampleJob} initialError="" />);

    expect(await screen.findByText("Senior Backend Engineer")).toBeInTheDocument();
    const cvLinks = await screen.findAllByRole("link", { name: /CV/i });
    expect(cvLinks.some((link) => link.getAttribute("href") === "https://example.com/cv.pdf")).toBe(true);
    expect(screen.getAllByRole("link").some((link) => link.getAttribute("href") === "/candidate")).toBe(true);
    expect(screen.queryByLabelText(/URL CV/i)).not.toBeInTheDocument();
  });

  it("submits a CV URL for authenticated candidates", async () => {
    const user = userEvent.setup();
    (fetchCurrentUserResumesWithAuth as jest.Mock).mockResolvedValue([]);
    (createResumeWithAuth as jest.Mock).mockResolvedValue({ id: 21 });

    render(<JobDetailPage initialJob={sampleJob} initialError="" />);

    const cvInput = await screen.findByLabelText(/URL CV/i);
    await user.type(cvInput, "https://example.com/new-cv.pdf");
    await user.click(screen.getByRole("button", { name: /ngay/i }));

    await waitFor(() => {
      expect(createResumeWithAuth).toHaveBeenCalledWith({
        jobId: 48,
        url: "https://example.com/new-cv.pdf"
      });
    });
  });
});
