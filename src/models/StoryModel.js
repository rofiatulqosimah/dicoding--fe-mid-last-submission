import { ApiService } from '../services/ApiService.js';
import { indexedDBService } from '../services/indexedDB.js';

export class StoryModel {
  constructor() {
    this.apiService = new ApiService();
    this.stories = [];
    this.offlineStories = [];
    this.currentPage = 1;
    this.pageSize = 10;
    this.baseUrl = 'https://story-api.dicoding.dev/v1';
  }

  async loadStories() {
    try {
      // Try to fetch from API first
      const response = await fetch('/api/stories');
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      this.stories = await response.json();
      
      // Save to IndexedDB for offline use
      await this.saveStoriesToIndexedDB(this.stories);
      
      return this.stories;
    } catch (error) {
      console.error('Error loading stories:', error);
      // If offline, try to get from IndexedDB
      try {
        const offlineStories = await indexedDBService.getAllLocations();
        this.offlineStories = offlineStories;
        return offlineStories;
      } catch (dbError) {
        console.error('Error loading stories from IndexedDB:', dbError);
        return [];
      }
    }
  }

  async fetchStories(page = 1, size = 10, location = 0) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(
        `${this.baseUrl}/stories?page=${page}&size=${size}&location=${location}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch stories');
      }

      const data = await response.json();

      if (page === 1) {
        this.stories = data.listStory || [];
      } else {
        this.stories = [...this.stories, ...(data.listStory || [])];
      }

      this.currentPage = page;
      return data;
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  }

  async fetchStoryById(id) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`${this.baseUrl}/stories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch story');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching story:', error);
      throw error;
    }
  }

  async addStory(story) {
    try {
      // Try to save to API first
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(story),
      });

      if (!response.ok) {
        throw new Error('Failed to add story');
      }

      const newStory = await response.json();
      this.stories.push(newStory);
      
      // Save to IndexedDB for offline use
      await this.saveStoriesToIndexedDB(this.stories);
      
      return newStory;
    } catch (error) {
      console.error('Error adding story:', error);
      // If offline, save to IndexedDB only
      try {
        const offlineStory = {
          ...story,
          id: Date.now(), // Generate temporary ID
          isOffline: true,
        };
        await indexedDBService.saveLocation(offlineStory);
        this.offlineStories.push(offlineStory);
        return offlineStory;
      } catch (dbError) {
        console.error('Error saving story to IndexedDB:', dbError);
        throw dbError;
      }
    }
  }

  async deleteStory(id) {
    try {
      // Try to delete from API first
      const response = await fetch(`/api/stories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }

      this.stories = this.stories.filter(story => story.id !== id);
      
      // Update IndexedDB
      await this.saveStoriesToIndexedDB(this.stories);
      
      return true;
    } catch (error) {
      console.error('Error deleting story:', error);
      // If offline, delete from IndexedDB only
      try {
        await indexedDBService.deleteLocation(id);
        this.offlineStories = this.offlineStories.filter(story => story.id !== id);
        return true;
      } catch (dbError) {
        console.error('Error deleting story from IndexedDB:', dbError);
        throw dbError;
      }
    }
  }

  async saveStoriesToIndexedDB(stories) {
    try {
      // Clear existing stories
      const existingStories = await indexedDBService.getAllLocations();
      for (const story of existingStories) {
        await indexedDBService.deleteLocation(story.id);
      }
      
      // Save new stories
      for (const story of stories) {
        await indexedDBService.saveLocation(story);
      }
    } catch (error) {
      console.error('Error saving stories to IndexedDB:', error);
      throw error;
    }
  }

  getStories() {
    return this.stories;
  }

  getOfflineStories() {
    return this.offlineStories;
  }
}
