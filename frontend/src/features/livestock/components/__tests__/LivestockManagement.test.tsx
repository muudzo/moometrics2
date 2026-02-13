import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LivestockManagement } from '../LivestockManagement';
import { AnimalProvider } from '@/context/AnimalContext';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock Lucide icons to avoid rendering complexities in tests
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...actual,
        PawPrint: () => <div data-testid="icon-pawprint" />,
        Plus: () => <div data-testid="icon-plus" />,
        Edit: () => <div data-testid="icon-edit" />,
        Beef: () => <div data-testid="icon-beef" />,
        Bird: () => <div data-testid="icon-bird" />,
        Rabbit: () => <div data-testid="icon-rabbit" />,
    };
});

// Mock UI components that are causing JSDOM/Radix issues
import React, { useContext } from 'react';

const MockDialogContext = React.createContext({ open: false, onOpenChange: (_open: boolean) => { } });

vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open, onOpenChange }: any) => (
        <MockDialogContext.Provider value={{ open, onOpenChange }}>
            {children}
        </MockDialogContext.Provider>
    ),
    DialogContent: ({ children }: any) => {
        const { open } = useContext(MockDialogContext);
        return open ? <div role="dialog">{children}</div> : null;
    },
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <h2>{children}</h2>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogTrigger: ({ children }: any) => {
        const { onOpenChange } = useContext(MockDialogContext);
        return <div data-testid="dialog-trigger" onClick={() => onOpenChange(true)}>{children}</div>;
    },
}));

vi.mock('@/components/ui/select', () => ({
    Select: ({ children, onValueChange, value }: any) => {
        return (
            <div data-testid="mock-select">
                {children}
                <select
                    data-testid="hidden-select"
                    value={value}
                    onChange={(e) => onValueChange(e.target.value)}
                >
                    <option value="">Select</option>
                    <option value="Cow">Cow</option>
                    <option value="Goat">Goat</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Pig">Pig</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Healthy">Healthy</option>
                    <option value="Sick">Sick</option>
                    <option value="Under Observation">Under Observation</option>
                    <option value="Up to Date">Up to Date</option>
                    <option value="Due">Due</option>
                    <option value="Not Vaccinated">Not Vaccinated</option>
                </select>
            </div>
        );
    },
    SelectTrigger: ({ children, 'data-testid': testId }: any) => <button data-testid={testId}>{children}</button>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, value }: any) => <div role="option" data-value={value}>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));



describe('LivestockManagement Component', () => {
    const setup = () => {
        return render(
            <AnimalProvider>
                <LivestockManagement />
            </AnimalProvider>
        );
    };

    it('should render the empty state initially', () => {
        setup();
        expect(screen.getByText(/No animals recorded yet/i)).toBeInTheDocument();
        expect(screen.getByText(/Record First Animal/i)).toBeInTheDocument();
    });

    it('should open the "Record Animal" dialog when clicking the add button', async () => {
        setup();
        const addButton = screen.getByText(/Record First Animal/i);
        fireEvent.click(addButton);

        expect(screen.getByText(/Record Animal/i, { selector: 'h2' })).toBeInTheDocument();
        expect(screen.getByLabelText(/Tag Number \*/i)).toBeInTheDocument();
    });

    it('should add a new animal successfully (Normal Case)', async () => {
        const user = userEvent.setup();
        setup();

        // Open dialog
        await user.click(screen.getByText(/Record First Animal/i));

        // Fill form
        const tagInput = screen.getByLabelText(/Tag Number \*/i);
        await user.type(tagInput, 'A100');

        // Select Animal Type
        const typeSelect = screen.getAllByTestId('hidden-select')[0];
        fireEvent.change(typeSelect, { target: { value: 'Cow' } });

        // Select Sex
        const sexSelect = screen.getAllByTestId('hidden-select')[1];
        fireEvent.change(sexSelect, { target: { value: 'Female' } });

        // Select Health Status (Buttons)
        const healthyButton = screen.getByRole('button', { name: /Healthy/i });
        await user.click(healthyButton);

        // Save
        const saveButton = screen.getByRole('button', { name: /Save Animal/i });
        await user.click(saveButton);

        // Verify animal card exists
        await waitFor(() => {
            expect(screen.getByText('A100')).toBeInTheDocument();
            expect(screen.getByText(/Cow • Female/i)).toBeInTheDocument();
        });
    });

    it('should not save an animal if required fields are missing (Edge Case)', async () => {
        const user = userEvent.setup();
        setup();

        // Open dialog
        await user.click(screen.getByText(/Record First Animal/i));

        // Try to save without any data
        const saveButton = screen.getByRole('button', { name: /Save Animal/i });
        await user.click(saveButton);

        // Dialog should still be open (title still visible)
        expect(screen.getByText(/Record Animal/i, { selector: 'h2' })).toBeInTheDocument();

        // Fill only tag number
        await user.type(screen.getByLabelText(/Tag Number \*/i), 'A200');
        await user.click(saveButton);
        expect(screen.getByText(/Record Animal/i, { selector: 'h2' })).toBeInTheDocument();
    });

    it('should edit an existing animal successfully', async () => {
        const user = userEvent.setup();
        setup();

        // Add an animal first
        await user.click(screen.getByText(/Record First Animal/i));
        await user.type(screen.getByLabelText(/Tag Number \*/i), 'E1');

        const typeSelect = screen.getAllByTestId('hidden-select')[0];
        fireEvent.change(typeSelect, { target: { value: 'Cow' } });

        const sexSelect = screen.getAllByTestId('hidden-select')[1];
        fireEvent.change(sexSelect, { target: { value: 'Male' } });

        await user.click(screen.getByRole('button', { name: /Save Animal/i }));

        // Find and click Edit button on the card
        const editButton = await screen.findByTestId('icon-edit');
        await user.click(editButton.parentElement!);

        // Change status to Sick
        const sickButton = screen.getByRole('button', { name: /Sick/i });
        await user.click(sickButton);

        // Update
        await user.click(screen.getByRole('button', { name: /Update Animal/i }));

        // Verify status changed
        await waitFor(() => {
            expect(screen.getByText('Sick')).toBeInTheDocument();
        });
    });

    it('should reset form and close dialog on Cancel', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByText(/Record First Animal/i));
        await user.type(screen.getByLabelText(/Tag Number \*/i), 'CANCEL-ME');

        const cancelButton = screen.getByRole('button', { name: /Cancel/i });
        await user.click(cancelButton);

        // Dialog should be closed
        await waitFor(() => {
            expect(screen.queryByText(/Record Animal/i, { selector: 'h2' })).not.toBeInTheDocument();
        });

        // Open again and verify field is empty
        await user.click(screen.getByText(/Record First Animal/i));
        expect((screen.getByLabelText(/Tag Number \*/i) as HTMLInputElement).value).toBe('');
    });
});
