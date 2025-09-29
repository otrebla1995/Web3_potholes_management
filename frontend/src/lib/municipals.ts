import { parseAbiItem, type PublicClient } from 'viem'

// Build the current authorized municipal set from events
export async function getAuthorizedMunicipals(
  publicClient: PublicClient,
  contractAddress: `0x${string}`
): Promise<string[]> {
  // Fetch added events
  const addedLogs = await publicClient.getLogs({
    address: contractAddress,
    event: parseAbiItem('event MunicipalAuthorityAdded(address indexed authority)'),
    fromBlock: BigInt(0),
    toBlock: 'latest',
  })

  // Fetch removed events
  const removedLogs = await publicClient.getLogs({
    address: contractAddress,
    event: parseAbiItem('event MunicipalAuthorityRemoved(address indexed authority)'),
    fromBlock: BigInt(0),
    toBlock: 'latest',
  })

  const set = new Set<string>()
  for (const log of addedLogs) {
    const addr = String(log.args.authority)
    if (addr) set.add(addr.toLowerCase())
  }
  for (const log of removedLogs) {
    const addr = String(log.args.authority)
    if (addr) set.delete(addr.toLowerCase())
  }
  return Array.from(set)
}
