import { render, screen } from "@testing-library/react";
import CandidateWorkspacePage from "../../pages/candidate";
import { useAuth } from "../../contexts/auth-context";
import { fetchCurrentUserResumesWithAuth } from "../../services/auth-rbac-api";
import { fetchAllJobs, fetchSavedJobsWithAuth } from "../../services/jobhunter-api";
import type { Job, ResumeItem } from "../../types/models";

jest.mock("../../contexts/auth-context", () => ({
  useAuth: jest.fn()
}));

jest.mock("../../services/auth-rbac-api", () => ({
  fetchCurrentUserResumesWithAuth: jest.fn()
}));

jest.mock("../../services/jobhunter-api", () => ({
  fetchAllJobs: jest.fn(),
  fetchSavedJobsWithAuth: jest.fn(),
  unsaveJobWithAuth: jest.fn()
}));

const sampleJob: Job = {
  id: 48,
  name: "Senior Frontend Engineer",
  location: "HANOI",
  salary: 35000000,
  quantity: 2,
  level: "SENIOR",
  active: true,
  endDate: "2099-12-31T00:00:00.000Z",
  description: "Build excellent product experiences.",
  company: {
    id: 9,
    name: "Jobhunter Labs",
    address: "Ha Noi"
  },
  skills: [{ id: 1, name: "React" }]
};

const sampleResume: ResumeItem = {
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
    name: "Senior Frontend Engineer"
  }
};

describe("CandidateWorkspacePage", () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      currentUser: {
        id: 5,
        name: "Candidate One",
        email: "candidate@example.com",
        role: { name: "USER" }
      },
      roleName: "USER",
      canAccessManagement: false
    });
    (fetchAllJobs as jest.Mock).mockResolvedValue([sampleJob]);
    (fetchCurrentUserResumesWithAuth as jest.Mock).mockResolvedValue([sampleResume]);
    (fetchSavedJobsWithAuth as jest.Mock).mockResolvedValue([sampleJob]);
  });

  it("shows application history and account-synced saved jobs", async () => {
    render(<CandidateWorkspacePage />);

    expect(await screen.findByText("Candidate One", { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText("Senior Frontend Engineer").length).toBeGreaterThan(0);
    expect(screen.getByText("recruiter@example.com", { exact: false })).toBeInTheDocument();
    expect(fetchSavedJobsWithAuth).toHaveBeenCalled();
  });
});
