import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import JobsBoard from "../../components/home/JobsBoard";
import type { Job } from "../../types/models";

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

describe("JobsBoard", () => {
  it("exposes real sort control for public job browsing", async () => {
    const user = userEvent.setup();
    const onSortModeChange = jest.fn();

    render(
      <JobsBoard
        keyword=""
        location="ALL"
        level="ALL"
        skill="ALL"
        salaryMin=""
        salaryMax=""
        activeFilterCount={0}
        isFilteringKeyword={false}
        locationOptions={["HANOI"]}
        levelOptions={["SENIOR"]}
        skillOptions={["React"]}
        jobs={[sampleJob]}
        totalItems={1}
        sortMode="latest"
        selectedJobId={sampleJob.id}
        selectedJob={sampleJob}
        currentPage={1}
        totalPages={1}
        paginationNumbers={[1]}
        bookmarkedJobIds={[]}
        bookmarkBusyJobIds={[]}
        jobsSectionRef={createRef<HTMLElement>()}
        onKeywordChange={jest.fn()}
        onLocationChange={jest.fn()}
        onLevelChange={jest.fn()}
        onSkillChange={jest.fn()}
        onSalaryMinChange={jest.fn()}
        onSalaryMaxChange={jest.fn()}
        onSortModeChange={onSortModeChange}
        onReset={jest.fn()}
        onSelectJob={jest.fn()}
        onCurrentPageChange={jest.fn()}
      />
    );

    await user.selectOptions(screen.getByTestId("jobs-sort-select"), "salary_desc");

    expect(onSortModeChange).toHaveBeenCalledWith("salary_desc");
  });
});
