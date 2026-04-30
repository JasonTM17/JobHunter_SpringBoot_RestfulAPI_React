import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/router";
import JobCard from "../../components/jobs/JobCard";
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
  description: "<p>Build excellent product experiences with React.</p>",
  company: {
    id: 9,
    name: "Jobhunter Labs",
    address: "Hà Nội"
  },
  skills: [
    { id: 1, name: "React" },
    { id: 2, name: "TypeScript" }
  ]
};

describe("JobCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
    const router = useRouter() as ReturnType<typeof useRouter> & { push: jest.Mock };
    router.push.mockClear();
  });

  it("supports quick view, account-scoped bookmark and apply CTA", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const router = useRouter() as ReturnType<typeof useRouter> & { push: jest.Mock };

    render(<JobCard job={sampleJob} selected={false} onSelect={onSelect} bookmarkScope="candidate@example.com" />);

    await user.click(screen.getByTestId("job-card-quick-view"));
    expect(onSelect).toHaveBeenCalledWith(48);

    await user.click(screen.getByTestId("job-card-bookmark"));
    expect(window.localStorage.getItem("jh_bookmarks:candidate@example.com")).toBe("[48]");

    await user.click(screen.getByTestId("job-card-bookmark"));
    expect(window.localStorage.getItem("jh_bookmarks:candidate@example.com")).toBe("[]");

    await user.click(screen.getByTestId("job-card-apply"));
    expect(router.push).toHaveBeenCalledWith("/jobs/48");

    expect(screen.getByTestId("job-card-detail")).toHaveAttribute("href", "/jobs/48");
  });

  it("supports account-synced bookmark callbacks", async () => {
    const user = userEvent.setup();
    const onBookmarkToggle = jest.fn();

    render(
      <JobCard
        job={sampleJob}
        selected={false}
        onSelect={jest.fn()}
        bookmarked={false}
        onBookmarkToggle={onBookmarkToggle}
      />
    );

    await user.click(screen.getByTestId("job-card-bookmark"));

    expect(onBookmarkToggle).toHaveBeenCalledWith(sampleJob, true);
    expect(window.localStorage.getItem("jh_bookmarks:guest")).toBeNull();
  });
});
