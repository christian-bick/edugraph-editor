import type { Meta, StoryObj } from '@storybook/react-vite';

import { Footer } from './Footer.tsx';

const meta = {
  title: 'Search/Footer',
  component: Footer,
  tags: ['autodocs'],
  args: {
  },
} satisfies Meta<typeof Footer>;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {}
}

export default meta;
