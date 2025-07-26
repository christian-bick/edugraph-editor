import type { Meta, StoryObj } from '@storybook/react-vite';
import {NavButton} from "./NavButton.tsx";

const meta = {
    title: 'Search/NavButton',
    component: NavButton,
    tags: ['autodocs'],
    args: {}
} satisfies Meta<typeof NavButton>;

type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
    args: {
        label: "Lorem",
        active: false
    },
}

export const Active: Story = {
    args: {
        active: true
    },
}

export default meta;