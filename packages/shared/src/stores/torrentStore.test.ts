import { beforeEach, describe, expect, it } from 'vitest';
import { useTorrentStore } from './torrentStore';

describe('useTorrentStore sorting', () => {
  beforeEach(() => {
    useTorrentStore.setState({
      sortField: 'added_on',
      sortDirection: 'desc',
    });
  });

  it('uses the new field default direction when switching sort fields', () => {
    useTorrentStore.getState().setSortField('name');
    expect(useTorrentStore.getState().sortDirection).toBe('asc');

    useTorrentStore.getState().setSortField('added_on');

    expect(useTorrentStore.getState().sortField).toBe('added_on');
    expect(useTorrentStore.getState().sortDirection).toBe('desc');
  });

  it('keeps direction unchanged when setting the active sort field', () => {
    useTorrentStore.getState().setSortField('name');
    useTorrentStore.getState().toggleSortDirection();

    expect(useTorrentStore.getState().sortDirection).toBe('desc');

    useTorrentStore.getState().setSortField('name');

    expect(useTorrentStore.getState().sortDirection).toBe('desc');
  });
});
