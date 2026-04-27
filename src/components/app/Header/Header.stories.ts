import type {Meta, StoryObj} from '@storybook/react-vite';

import {Header} from './Header.tsx';

const meta = {
  title: 'Search/Header',
  component: Header,
  tags: ['autodocs'],
  args: {
  },
} satisfies Meta<typeof Header>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {}
}

export default meta;
