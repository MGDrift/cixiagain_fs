import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../src/app/api/auth/[...nextauth]/route';
import prisma from '../../../src/libs/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', ['POST']);
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	try {
		const session: any = await getServerSession(req, res, authOptions as any);
		if (!session?.user?.id) {
			return res.status(401).json({ error: 'Debes iniciar sesión para calificar' });
		}

		const { productId, value } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
		const pid = Number(productId);
		const val = Number(value);
		const uid = Number(session.user.id);

		if (!Number.isFinite(pid)) return res.status(400).json({ error: 'Producto inválido' });
		if (!Number.isFinite(val) || val < 1 || val > 5) return res.status(400).json({ error: 'Valor inválido' });

		const product = await prisma.product.findUnique({ where: { id: pid } });
		if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

		const rating = await prisma.rating.upsert({
			where: { userId_productId: { userId: uid, productId: pid } },
			update: { value: val },
			create: { value: val, productId: pid, userId: uid },
		});

		return res.status(200).json(rating);
	} catch (e: any) {
		console.error('Error creando rating (pages/api):', e);
		return res.status(500).json({ error: 'Error al guardar rating' });
	}
}

