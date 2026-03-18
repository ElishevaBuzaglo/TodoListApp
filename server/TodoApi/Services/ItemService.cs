using Microsoft.EntityFrameworkCore;
using TodoApi.Models;

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

        public async Task<Item> CreateAsync(Item newItem, int userId)
        {
            newItem.UserId = userId;
            _context.Items.Add(newItem);
            await _context.SaveChangesAsync();
            return newItem;
        }

        public async Task<bool> UpdateAsync(int id, Item inputItem, int userId)
        {
            var item = await _context.Items.FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);
            if (item == null) return false;

            item.IsComplete = inputItem.IsComplete;
            if (!string.IsNullOrEmpty(inputItem.Name)) item.Name = inputItem.Name;

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