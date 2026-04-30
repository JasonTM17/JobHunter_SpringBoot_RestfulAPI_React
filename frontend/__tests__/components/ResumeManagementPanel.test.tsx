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

function buildResume(id: number, status: ResumeItem["status"] = "PENDING"): ResumeItem {
  return {
    ...sampleResume,
    id,
    email: `candidate${id}@example.com`,
    status,
    createdDate: `2026-04-${String(30 - id).padStart(2, "0")}T08:00:00.000Z`,
    user: {
      id,
      name: `Candidate ${id}`
    },
    job: {
      id: 100 + id,
      name: `Pipeline Job ${id}`
    }
  };
}

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
        auditsByResumeId={{
          17: [
            {
              id: 1,
              resumeId: 17,
              previousStatus: "PENDING",
              nextStatus: "REVIEWING",
              note: "Đã mở CV",
              actorEmail: "recruiter@example.com",
              createdAt: "2026-04-02T10:30:00.000Z"
            }
          ]
        }}
        onUpdateResumeStatus={onUpdateResumeStatus}
        onDeleteResume={jest.fn()}
      />
    );

    expect(screen.getByText("Candidate One")).toBeInTheDocument();
    expect(screen.getByText("Senior Frontend Engineer")).toBeInTheDocument();
    expect(screen.getAllByText("recruiter@example.com", { exact: false }).length).toBeGreaterThanOrEqual(1);

    await user.selectOptions(screen.getByTestId("resume-status-select-17"), "REVIEWING");
    await user.type(screen.getByPlaceholderText("Ghi chú audit"), "CV phù hợp");
    await user.click(screen.getByTestId("resume-status-save-17"));

    expect(onUpdateResumeStatus).toHaveBeenCalledWith(sampleResume, "REVIEWING", "CV phù hợp");
    expect(screen.getByText("Đã mở CV")).toBeInTheDocument();
  });

  it("filters and paginates recruiter resume pipeline rows", async () => {
    const user = userEvent.setup();
    const resumes = Array.from({ length: 9 }, (_, index) =>
      buildResume(index + 1, index === 8 ? "APPROVED" : "PENDING")
    );

    render(
      <ResumeManagementPanel
        resumes={resumes}
        loadingAction={false}
        canReadResumes
        canUpdateResume
        canDeleteResume={false}
        onUpdateResumeStatus={jest.fn().mockResolvedValue(undefined)}
        onDeleteResume={jest.fn()}
      />
    );

    expect(screen.getByText("Candidate 1")).toBeInTheDocument();
    expect(screen.queryByText("Candidate 9")).not.toBeInTheDocument();
    expect(screen.getByText(/1-8 \/ 9/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sau" }));

    expect(screen.getByText("Candidate 9")).toBeInTheDocument();
    expect(screen.queryByText("Candidate 1")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Lọc trạng thái hồ sơ"), "APPROVED");

    expect(screen.getByText("Candidate 9")).toBeInTheDocument();
    expect(screen.queryByText("Candidate 1")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Tìm hồ sơ"), "missing candidate");
    expect(screen.getByText("Không tìm thấy hồ sơ phù hợp với bộ lọc hiện tại.")).toBeInTheDocument();
  });
});
