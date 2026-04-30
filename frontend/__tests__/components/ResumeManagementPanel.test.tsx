import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResumeManagementPanel from "../../components/management/ResumeManagementPanel";
import type { ResumeItem } from "../../types/models";

const sampleResume: ResumeItem = {
  id: 17,
  email: "candidate@example.com",
  url: "https://example.com/cv.pdf",
  status: "PENDING",
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

describe("ResumeManagementPanel", () => {
  it("renders recruiter resume data and submits status changes", async () => {
    const user = userEvent.setup();
    const onUpdateResumeStatus = jest.fn().mockResolvedValue(undefined);

    render(
      <ResumeManagementPanel
        resumes={[sampleResume]}
        loadingAction={false}
        canReadResumes
        canUpdateResume
        canDeleteResume={false}
        onUpdateResumeStatus={onUpdateResumeStatus}
        onDeleteResume={jest.fn()}
      />
    );

    expect(screen.getByText("Candidate One")).toBeInTheDocument();
    expect(screen.getByText("Senior Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("recruiter@example.com", { exact: false })).toBeInTheDocument();

    await user.selectOptions(screen.getByTestId("resume-status-select-17"), "REVIEWING");
    await user.click(screen.getByTestId("resume-status-save-17"));

    expect(onUpdateResumeStatus).toHaveBeenCalledWith(sampleResume, "REVIEWING");
  });
});
