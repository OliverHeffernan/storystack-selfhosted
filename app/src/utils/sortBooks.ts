import Book from '../classes/Book';
export default function sortBooksByDate(a: Book, b: Book): number {
	const endDateA = a.getEndDate();
	const endDateB = b.getEndDate();

	const endComp = compareDates(endDateA, endDateB);
	if (endComp !== 0) {
		return endComp;
	}

	const statusComp = statusToInt(a.getStatus()) - statusToInt(b.getStatus());
	if (statusComp !== 0) {
		return statusComp;
	}

	const startDateA = a.getStartDate();
	const startDateB = b.getStartDate();

	const startComp = compareDates(startDateA, startDateB);
	if (startComp !== 0) {
		return startComp;
	}

	const creationDateA = a.getCreationDate();
	const creationDateB = b.getCreationDate();

	const creationComp = compareDates(creationDateA, creationDateB);
	if (creationComp !== 0) {
		return creationComp;
	}

	return a.getPages() - b.getPages();
}

function compareDates(dateA: Date | null, dateB: Date | null): number {
	if (dateA === null && dateB === null) return 0;
	if (dateA === null) return 1;
	if (dateB === null) return -1;
	return dateB.getTime() - dateA.getTime();
}

function statusToInt(status: string): number {
	switch (status) {
		case 'completed':
			return 3;
		case 'reading':
			return 2;
		case 'want-to-read':
			return 1;
		default:
			return 0;
	}
}
