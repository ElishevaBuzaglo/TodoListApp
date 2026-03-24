using Microsoft.EntityFrameworkCore;
using TodoApi.Models;
// וודאי שה-Namespace כאן תואם למיקום של ה-ItemDTO שלך
using TodoApi.DTOs; 

namespace TodoApi.Services
{
    public class ItemService
    {
        private readonly ToDoDbContext _context;
        public ItemService(ToDoDbContext context) => _context = context;

        public async Task<List<Item>> GetAllAsync(int userId)
        {
            return await _context.Items.Where(i => i.UserId == userId).ToListAsync();
        }

        // שינוי 1: קבלת DTO ויצירת Item חדש ממנו
        public async Task<Item> CreateAsync(ItemDTO newItemDto, int userId)
        {
            var newItem = new Item
            {
                Name = newItemDto.Name,
                IsComplete = newItemDto.IsComplete,
                UserId = userId
            };

            _context.Items.Add(newItem);
            await _context.SaveChangesAsync();
            return newItem;
        }

        // שינוי 2: קבלת DTO ועדכון משימה קיימת
        public async Task<bool> UpdateAsync(int id, ItemDTO inputItemDto, int userId)
        {
            var item = await _context.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
            if (item == null) return false;

            // מיפוי השדות מה-DTO למודל
            item.IsComplete = inputItemDto.IsComplete;
            if (!string.IsNullOrEmpty(inputItemDto.Name)) item.Name = inputItemDto.Name;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id, int userId)
        {
            var item = await _context.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
            if (item == null) return false;

            _context.Items.Remove(item);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}