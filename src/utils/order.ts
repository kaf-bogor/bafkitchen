import { IProduct, IOrder } from '@/interfaces'

import { toIDRFormat } from './currency'

export const generateOrderText = ({
  items,
  customer,
  totalPrice,
  orderId
}: {
  items: IProduct.IProductCart[]
  customer: IOrder.IOrdererInputForm
  totalPrice: number
  orderId: string
}) => {
  const text =
    `Assalamualaikum, saya mau order.
  ${items
    .map((product, i) => {
      return `\n${i + 1}. *${product.name}*
    Quantity: ${product.quantity}
    Harga (@): ${toIDRFormat(product.price)}
    Total Harga: ${toIDRFormat(product.price * product.quantity)}`
    })
    .join(' ')}` +
    `\n\nTotal : *${toIDRFormat(totalPrice)}*` +
    `\n\n*Pengiriman* : ${customer.address}\n` +
    '--------------------------------' +
    '\n*Nama :*' +
    `\n${customer.name} ( ${customer.phoneNumber} )` +
    '\n\n*Alamat :*' +
    `\n${customer.address}` +
    '\n--------------------------------' +
    `\nHalaman order: ${process.env.NEXT_PUBLIC_APP_DOMAIN}/orders/${orderId}`

  return text
}

export const generateOrderHtmlEmail = ({
  items,
  customer,
  totalPrice,
  orderId
}: {
  items: IProduct.IProductCart[]
  customer: IOrder.IOrdererInputForm
  totalPrice: number
  orderId: string
}) => {
  const itemsHtml = items
    .map(
      (product, i) => `
      <tr>
        <td>${i + 1}. ${product.name}</td>
        <td>${product.quantity}</td>
        <td>${toIDRFormat(product.price)}</td>
        <td>${toIDRFormat(product.price * product.quantity)}</td>
      </tr>
    `
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Konfirmasi Pesanan - Order ${orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { font-weight: bold; }
        .customer-info { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Konfirmasi Pesanan</h1>
        <p>Assalamualaikum, terima kasih atas pesanan Anda.</p>
        
        <h2>Detail Pesanan</h2>
        <table>
          <thead>
            <tr>
              <th>Produk</th>
              <th>Jumlah</th>
              <th>Harga</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="3">Total</td>
              <td>${toIDRFormat(totalPrice)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="customer-info">
          <h2>Informasi Pelanggan</h2>
          <p><strong>Nama:</strong> ${customer.name}</p>
          <p><strong>Telepon:</strong> ${customer.phoneNumber}</p>
          <p><strong>Alamat:</strong> ${customer.address}</p>
        </div>

        <p>Anda dapat melihat detail pesanan Anda di:</p>
        <p><a href="https://bafkitchen.posku.online/orders/${orderId}">https://bafkitchen.posku.online/orders/${orderId}</a></p>

        <p>Jika Anda memiliki pertanyaan, jangan ragu untuk menghubungi kami.</p>

        <p>Jazakumullahu khairan atas kepercayaan Anda!</p>
      </div>
    </body>
    </html>
  `

  return html
}


export const generateReports = (orders: IOrder.IOrder[]) => {
    let totalOrderValue = 0;
    let totalProfit = 0;
    let totalProductQuantity = 0;
    const uniqueProducts = new Set();
    const uniqueBuyers = new Set();

    orders.forEach(order => {
        // Safety check: ensure productOrders exists and is an array
        if (!order.productOrders || !Array.isArray(order.productOrders)) {
            console.warn('Order missing productOrders:', order.id);
            return; // Skip this order
        }

        // Loop through each product in the order
        order.productOrders.forEach(productOrder => {
            // Safety checks for productOrder and product data
            if (!productOrder || !productOrder.product) {
                console.warn('Invalid product order data:', productOrder);
                return; // Skip this product order
            }

            const price = productOrder.product.price || 0;
            const basePrice = productOrder.product.priceBase || 0;
            const quantity = productOrder.quantity || 0;

            // 1. Calculate order total
            totalOrderValue += price * quantity;

            // 2. Calculate profit
            totalProfit += (price - basePrice) * quantity;

            // 3. Track total product quantity and unique products
            totalProductQuantity += quantity;
            uniqueProducts.add(productOrder.productId || productOrder.product.id);
        });

        // 4. Track unique buyers
        if (order.customerId) {
            uniqueBuyers.add(order.customerId);
        }
    });

    return {
        totalOrderValue,
        totalProfit,
        totalProductQuantity,
        uniqueProductsCount: uniqueProducts.size,
        uniqueBuyersCount: uniqueBuyers.size
    };
}