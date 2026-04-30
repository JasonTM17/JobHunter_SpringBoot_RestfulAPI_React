import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SubscriberSection from "../../components/home/SubscriberSection";
import type { Skill } from "../../types/models";

const skills: Skill[] = [
  { id: 1, name: "React" },
  { id: 2, name: "Java" }
];

describe("SubscriberSection", () => {
  it("collects subscriber data and toggles interested skills", async () => {
    const user = userEvent.setup();
    const onEmailChange = jest.fn();
    const onNameChange = jest.fn();
    const onToggleSkill = jest.fn();
    const onSubmit = jest.fn();

    render(
      <SubscriberSection
        email=""
        name=""
        selectedSkillIds={[1]}
        skills={skills}
        submitting={false}
        message=""
        error=""
        onEmailChange={onEmailChange}
        onNameChange={onNameChange}
        onToggleSkill={onToggleSkill}
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByPlaceholderText("you@example.com"), "candidate@mail.com");
    await user.type(screen.getByPlaceholderText("Tên của bạn"), "Candidate One");
    await user.click(screen.getByRole("button", { name: "Java" }));
    await user.click(screen.getByRole("button", { name: /Đăng ký/i }));

    expect(onEmailChange).toHaveBeenCalled();
    expect(onNameChange).toHaveBeenCalled();
    expect(onToggleSkill).toHaveBeenCalledWith(2);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows success and error states from parent workflow", () => {
    render(
      <SubscriberSection
        email="candidate@mail.com"
        name="Candidate One"
        selectedSkillIds={[]}
        skills={[]}
        submitting={false}
        message="Đăng ký thành công"
        error="Email đã tồn tại"
        onEmailChange={jest.fn()}
        onNameChange={jest.fn()}
        onToggleSkill={jest.fn()}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByText("Đăng ký thành công")).toBeInTheDocument();
    expect(screen.getByText("Email đã tồn tại")).toBeInTheDocument();
  });
});
